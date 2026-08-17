// Shared by platform/auth-session.ts (server, sets the JWT's real expiry) and
// components/shared/idle-session-guard.tsx (client, decides when to warn/sign
// out) — one number, so the two can never drift out of sync.
export const IDLE_TIMEOUT_MINUTES = 30;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
