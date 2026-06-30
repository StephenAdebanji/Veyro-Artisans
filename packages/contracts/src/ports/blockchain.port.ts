import type { BlockchainRecordStatus, BlockchainRecordType } from "../common";

export interface BlockchainRecordSummary {
  id: string;
  refId: string;
  type: BlockchainRecordType;
  status: BlockchainRecordStatus;
  txHash: string | null;
  network: string | null;
  blockNumber: number | null;
}

/**
 * Owns: BlockchainRecord. Writes are asynchronous by design: `enqueueRecord` returns immediately
 * with a PENDING record so a slow/variable chain confirmation never blocks the calling API
 * request; a worker (in-process today, a separate consumer process later) performs the actual
 * on-chain write and flips the record to CONFIRMED/FAILED, then publishes BlockchainRecordWritten.
 */
export interface BlockchainServicePort {
  enqueueRecord(type: BlockchainRecordType, refId: string, payload: object): Promise<string>;
  getRecordsForRef(refId: string): Promise<BlockchainRecordSummary[]>;
}
