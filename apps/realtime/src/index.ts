import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { registerChatGateway } from "./chat-gateway";
import { registerMatchingGateway } from "./matching-gateway";

const PORT = Number(process.env.PORT ?? 4001);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.WEB_PUBLIC_URL ?? "*" },
});

registerMatchingGateway(io, app);
registerChatGateway(io);

httpServer.listen(PORT, () => {
  console.log(`[realtime] listening on :${PORT}`);
});
