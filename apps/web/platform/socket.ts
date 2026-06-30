"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/** One shared Socket.io client per browser tab, connected to apps/realtime.
 * `token` is the short-lived realtime token issued by services/auth (see
 * services/auth/auth.service.ts), not the NextAuth session cookie itself —
 * apps/realtime is a separate process and verifies this token independently. */
export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001", {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
}
