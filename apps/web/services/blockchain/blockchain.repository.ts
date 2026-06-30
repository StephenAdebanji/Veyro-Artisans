import type {
  BlockchainNetwork,
  BlockchainRecordType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const blockchainRepository = {
  async createPending(type: BlockchainRecordType, refId: string, payload: object) {
    return prisma.blockchainRecord.create({
      data: { type, refId, payload: payload as unknown as Prisma.InputJsonValue, status: "PENDING" },
    });
  },

  async markConfirmed(
    id: string,
    txHash: string,
    contractAddress: string,
    network: BlockchainNetwork,
    blockNumber?: number,
  ) {
    return prisma.blockchainRecord.update({
      where: { id },
      data: { status: "CONFIRMED", txHash, contractAddress, network, blockNumber, confirmedAt: new Date() },
    });
  },

  async markFailed(id: string) {
    return prisma.blockchainRecord.update({ where: { id }, data: { status: "FAILED" } });
  },

  async findForRef(refId: string) {
    return prisma.blockchainRecord.findMany({ where: { refId }, orderBy: { createdAt: "desc" } });
  },
};
