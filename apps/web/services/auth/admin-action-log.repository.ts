import { prisma } from "@/platform/prisma";

export const adminActionLogRepository = {
  async record(data: { adminId: string; action: string; targetType: string; targetId: string; notes?: string }) {
    return prisma.adminActionLog.create({ data });
  },

  async list(limit = 200) {
    return prisma.adminActionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { admin: { select: { email: true, name: true } } },
    });
  },
};
