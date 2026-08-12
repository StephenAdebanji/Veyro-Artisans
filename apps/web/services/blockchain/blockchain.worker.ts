import type { BlockchainRecordType } from "@prisma/client";
import { eventBus } from "@/platform/event-bus";
import { blockchainRepository } from "./blockchain.repository";
import { writeTrustRecord } from "./chain-adapter";

// All chain writes share one wallet, and chain-adapter.ts asks the RPC
// provider for that wallet's "next" nonce independently on every call
// (getSigner() constructs a fresh ethers.Wallet each time, with no local
// nonce tracking). Firing writes concurrently — e.g. verifyIdentity()
// publishes IdentityVerified, then TrustScoreUpdated moments later, each
// enqueuing its own write — let two "next nonce" lookups race and resolve
// to the same value, so the second submission was rejected by the network
// with NONCE_EXPIRED ("nonce too low"). Chaining every write through this
// one promise ensures only one is ever in flight, so each subsequent
// lookup sees the previous submission already accounted for.
let chainQueue: Promise<unknown> = Promise.resolve();

/**
 * In-process stand-in for a real queue consumer (an SQS/RabbitMQ-backed worker
 * process once Blockchain Service is physically extracted — it's first in the
 * extraction order in docs/ARCHITECTURE.md precisely because it's already
 * shaped like this). Runs the actual chain write off the request path so a
 * slow/variable confirmation time never blocks the API call that triggered it.
 */
export function processRecordAsync(
  recordId: string,
  type: BlockchainRecordType,
  refId: string,
  payload: object,
): void {
  chainQueue = chainQueue.catch(() => {}).then(async () => {
    try {
      const result = await writeTrustRecord(type, refId, payload);
      await blockchainRepository.markConfirmed(
        recordId,
        result.txHash,
        result.contractAddress,
        result.network,
        result.blockNumber,
      );

      eventBus.publish({
        type: "BlockchainRecordWritten",
        recordId,
        refId,
        recordType: type,
        txHash: result.txHash,
        network: result.network,
        occurredAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`[blockchain.worker] failed to write record ${recordId}`, error);
      await blockchainRepository.markFailed(recordId);
    }
  });
}
