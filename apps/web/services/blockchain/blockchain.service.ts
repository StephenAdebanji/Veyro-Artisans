import type { BlockchainRecordType } from "@prisma/client";
import type { BlockchainRecordSummary, BlockchainServicePort } from "@veyro/contracts";
import { blockchainRepository } from "./blockchain.repository";
import { processRecordAsync } from "./blockchain.worker";

/** Owns: BlockchainRecord. Writes are asynchronous by design — see
 * blockchain.worker.ts and packages/contracts' BlockchainServicePort doc
 * comment for why. */
class BlockchainService implements BlockchainServicePort {
  async enqueueRecord(type: BlockchainRecordType, refId: string, payload: object): Promise<string> {
    const record = await blockchainRepository.createPending(type, refId, payload);
    processRecordAsync(record.id, type, refId, payload);
    return record.id;
  }

  /** Re-queues any FAILED records for a given ref so they get another write
   *  attempt. Called after a trust score recalc so stale FAILED entries don't
   *  sit permanently on an artisan's blockchain panel. */
  async retryFailedForRef(refId: string): Promise<void> {
    const failed = await blockchainRepository.findFailedForRef(refId);
    for (const record of failed) {
      processRecordAsync(record.id, record.type, record.refId, record.payload as object);
    }
  }

  async getRecordsForRef(refId: string): Promise<BlockchainRecordSummary[]> {
    const rows = await blockchainRepository.findForRef(refId);
    return rows.map((row) => ({
      id: row.id,
      refId: row.refId,
      type: row.type,
      status: row.status,
      txHash: row.txHash,
      network: row.network,
      blockNumber: row.blockNumber,
    }));
  }
}

export const blockchainService = new BlockchainService();
