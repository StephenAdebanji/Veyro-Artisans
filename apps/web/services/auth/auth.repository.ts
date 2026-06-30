import type { Role } from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: { email: string; phone?: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data });
  },

  async countAll() {
    return prisma.user.count();
  },
};
