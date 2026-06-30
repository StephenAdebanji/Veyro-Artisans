import jwt from "jsonwebtoken";

const SECRET = process.env.REALTIME_JWT_SECRET ?? "dev-only-insecure-secret";

export interface RealtimeTokenPayload {
  userId: string;
  role: "HOMEOWNER" | "ARTISAN" | "ADMIN";
}

// Deliberately re-implemented here rather than imported from apps/web's
// platform/realtime-token.ts — this is a separate deployable process and
// should own its own verification logic against the one shared secret, the
// same way it would if Chat/Matching were already split into real
// microservices.
export function verifyRealtimeToken(token: string): RealtimeTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as RealtimeTokenPayload & jwt.JwtPayload;
  } catch {
    return null;
  }
}
