import bcrypt from "bcryptjs";
import type {
  AdminActionLogEntry,
  AuthServicePort,
  AuthenticatedUser,
  RegisterUserInput,
  UserExport,
} from "@veyro/contracts";
import { eventBus } from "@/platform/event-bus";
import { authRepository } from "./auth.repository";
import { adminActionLogRepository } from "./admin-action-log.repository";
import type { User as UserRow } from "@prisma/client";

const PASSWORD_SALT_ROUNDS = 10;

function toAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return { id: row.id, email: row.email, name: (row as { name?: string | null }).name ?? null, role: row.role, status: row.status };
}

/** Owns: credentials, sessions, role assignment. Does NOT own profile data —
 * that's User Service, wired up via the UserRegistered event below. */
class AuthService implements AuthServicePort {
  async register(input: RegisterUserInput): Promise<AuthenticatedUser> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await authRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const row = await authRepository.create({
      email: normalizedEmail,
      phone: input.phone,
      passwordHash,
      role: input.role,
    });

    eventBus.publish({
      type: "UserRegistered",
      userId: row.id,
      role: row.role,
      email: row.email,
      occurredAt: new Date().toISOString(),
    });

    return toAuthenticatedUser(row);
  }

  async verifyCredentials(email: string, password: string): Promise<AuthenticatedUser | null> {
    const row = await authRepository.findByEmail(email.toLowerCase().trim());
    if (!row) return null;

    const valid = await bcrypt.compare(password, row.passwordHash);
    if (!valid) return null;

    if (row.status === "SUSPENDED") {
      // Return a sentinel object the sign-in handler can detect without exposing internals.
      throw new Error("SUSPENDED");
    }

    return toAuthenticatedUser(row);
  }

  async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    const row = await authRepository.findById(userId);
    return row ? toAuthenticatedUser(row) : null;
  }

  async exportUser(userId: string): Promise<UserExport | null> {
    const row = await authRepository.findById(userId);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: (row as { name?: string | null }).name ?? null,
      phone: row.phone ?? null,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await authRepository.deleteById(userId);
  }

  async logAdminAction(entry: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    notes?: string;
  }): Promise<void> {
    await adminActionLogRepository.record(entry);
  }

  async listAdminActionLog(limit?: number): Promise<AdminActionLogEntry[]> {
    const rows = await adminActionLogRepository.list(limit);
    return rows.map((row) => ({
      id: row.id,
      adminId: row.adminId,
      adminEmail: row.admin?.email ?? null,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}

export const authService = new AuthService();
