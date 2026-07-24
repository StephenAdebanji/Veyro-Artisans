import type { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/platform/prisma";

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: { email: string; phone?: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data });
  },

  async updateUser(userId: string, data: { email?: string; name?: string; role?: Role; status?: UserStatus }) {
    return prisma.user.update({ where: { id: userId }, data });
  },

  async countAll() {
    return prisma.user.count();
  },
};
