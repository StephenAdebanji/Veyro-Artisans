import bcrypt from "bcryptjs";
import type { AuthServicePort, AuthenticatedUser, RegisterUserInput } from "@veyro/contracts";
import { eventBus } from "@/platform/event-bus";
import { authRepository } from "./auth.repository";
import type { User as UserRow } from "@prisma/client";

const PASSWORD_SALT_ROUNDS = 10;

function toAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return { id: row.id, email: row.email, name: (row as { name?: string | null }).name ?? null, role: row.role, status: row.status };
}

/** Owns: credentials, sessions, role assignment. Does NOT own profile data —
 * that's User Service, wired up via the UserRegistered event below. */
class AuthService implements AuthServicePort {
  async register(input: RegisterUserInput): Promise<AuthenticatedUser> {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const row = await authRepository.create({
      email: input.email,
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
    const row = await authRepository.findByEmail(email);
    if (!row) return null;

    const valid = await bcrypt.compare(password, row.passwordHash);
    return valid ? toAuthenticatedUser(row) : null;
  }

  async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    const row = await authRepository.findById(userId);
    return row ? toAuthenticatedUser(row) : null;
  }
}

export const authService = new AuthService();
