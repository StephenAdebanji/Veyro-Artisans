// Shared by platform/auth-session.ts (server, sets the JWT's real expiry) and
// components/shared/idle-session-guard.tsx (client, decides when to warn/sign
// out) — one number, so the two can never drift out of sync.
// TEMP: set to 2 for manual testing — change back to 30 before deploying/demo.
export const IDLE_TIMEOUT_MINUTES = 2;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
