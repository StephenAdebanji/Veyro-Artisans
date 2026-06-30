import { NextResponse } from "next/server";
import { z } from "zod";
import { chatService } from "@/services/chat/chat.service";

const sendMessageSchema = z.object({
  senderId: z.string(),
  type: z.enum(["TEXT", "IMAGE", "LOCATION"]).default("TEXT"),
  content: z.string().optional(),
  mediaUrl: z.string().optional(),
});

// REST is the persistence path; Socket.io (apps/realtime) is the live delivery
// path — see docs/ARCHITECTURE.md. The realtime gateway calls this same route
// internally so there is exactly one place messages are written.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const messages = await chatService.listMessages(conversationId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await chatService.sendMessage({ conversationId, ...parsed.data });
  return NextResponse.json({ message }, { status: 201 });
}
