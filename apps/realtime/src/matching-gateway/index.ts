import type { Application, Request, Response } from "express";
import type { Server, Socket } from "socket.io";
import { verifyRealtimeToken } from "../auth";

/**
 * Websocket transport for Matching Service. Holds no business logic and never
 * touches the database — it only relays: (1) intents from connected sockets
 * are not handled here (offers/responses go through the REST API so they're
 * validated and persisted exactly once), and (2) server-to-server pushes from
 * apps/web after a Match is created/updated, fanned out to whoever is in that
 * service request's room.
 */
export function registerMatchingGateway(io: Server, app: Application): void {
  const namespace = io.of("/matching");

  namespace.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verifyRealtimeToken(token) : null;
    if (!payload) return next(new Error("Unauthorized"));
    socket.data.userId = payload.userId;
    socket.data.role = payload.role;
    next();
  });

  namespace.on("connection", (socket: Socket) => {
    // Homeowner watches a specific request for incoming offers.
    socket.on("join-request", ({ serviceRequestId }: { serviceRequestId: string }) => {
      socket.join(`request:${serviceRequestId}`);
    });

    socket.on("leave-request", ({ serviceRequestId }: { serviceRequestId: string }) => {
      socket.leave(`request:${serviceRequestId}`);
    });

    // Artisan subscribes to new requests matching their primary skill.
    socket.on("join-skill", ({ category }: { category: string }) => {
      socket.join(`skill:${category}`);
    });

    socket.on("leave-skill", ({ category }: { category: string }) => {
      socket.leave(`skill:${category}`);
    });
  });

  // Called by apps/web after a new ServiceRequest is created — broadcasts to
  // all artisans in the matching skill room so their dashboards update live.
  app.post("/internal/matching/broadcast", (req: Request, res: Response) => {
    const { category, ...payload } = req.body as { category: string; [key: string]: unknown };
    namespace.to(`skill:${category}`).emit("job:new", { category, ...payload });
    res.json({ ok: true });
  });

  // Called by apps/web after an artisan's offer is persisted — pushes the
  // enriched offer card to the homeowner's matching screen.
  app.post("/internal/matching/:serviceRequestId/offer", (req: Request, res: Response) => {
    namespace.to(`request:${req.params.serviceRequestId}`).emit("offer-created", req.body);
    res.json({ ok: true });
  });

  // Called by apps/web after the homeowner accepts/declines — notifies the
  // artisan whose offer was actioned and the homeowner's screen.
  app.post("/internal/matching/:serviceRequestId/responded", (req: Request, res: Response) => {
    namespace.to(`request:${req.params.serviceRequestId}`).emit("offer-responded", req.body);
    res.json({ ok: true });
  });
}
