import jwt from "jsonwebtoken";

const SECRET = process.env.REALTIME_JWT_SECRET ?? "dev-only-insecure-secret";

export interface RealtimeTokenPayload {
  userId: string;
  role: "HOMEOWNER" | "ARTISAN" | "ADMIN";
}

/** Short-lived token apps/realtime verifies on socket handshake. Deliberately
 * independent of the NextAuth session JWT so apps/realtime (a separate process)
 * never needs to share NextAuth's internal encode/decode scheme — just this one
 * shared secret, which is what makes it trivial to swap for a real auth-service
 * call once Auth Service is physically extracted. */
export function issueRealtimeToken(payload: RealtimeTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "10m" });
}

export function verifyRealtimeToken(token: string): RealtimeTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as RealtimeTokenPayload & jwt.JwtPayload;
  } catch {
    return null;
  }
}
