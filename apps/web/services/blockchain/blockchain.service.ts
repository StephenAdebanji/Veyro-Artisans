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
