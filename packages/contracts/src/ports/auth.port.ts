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
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
}

/** Owns: credentials, sessions, role assignment. Does NOT own profile data (see UserServicePort). */
export interface AuthServicePort {
  register(input: RegisterUserInput): Promise<AuthenticatedUser>;
  verifyCredentials(email: string, password: string): Promise<AuthenticatedUser | null>;
  getUserById(userId: string): Promise<AuthenticatedUser | null>;
}
