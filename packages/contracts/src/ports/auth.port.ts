import type { Role } from "../common";

export interface RegisterUserInput {
  email: string;
  phone?: string;
  password: string;
  role: Role;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
}

export interface AdminActionLogEntry {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  notes: string | null;
  createdAt: string;
}

export interface UserExport {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: string;
  updatedAt: string;
}

/** Owns: credentials, sessions, role assignment. Does NOT own profile data (see UserServicePort). */
export interface AuthServicePort {
  register(input: RegisterUserInput): Promise<AuthenticatedUser>;
  verifyCredentials(email: string, password: string): Promise<AuthenticatedUser | null>;
  getUserById(userId: string): Promise<AuthenticatedUser | null>;
  /** Self-service data export (GET /api/me/export) — never includes passwordHash. */
  exportUser(userId: string): Promise<UserExport | null>;
  /** Hard-deletes the User row. Caller must delete/detach every dependent
   * row in other schemas first (profiles, credentials, chat, notifications)
   * since only PasswordResetToken cascades at the DB level. */
  deleteUser(userId: string): Promise<void>;
  /** Audit trail for admin access to sensitive records (e.g. KYC credentials). */
  logAdminAction(entry: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    notes?: string;
  }): Promise<void>;
  listAdminActionLog(limit?: number): Promise<AdminActionLogEntry[]>;
}
