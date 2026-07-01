import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { prisma } from "@/platform/prisma";

const schema = z.object({
  description: z.string().min(10, "Please provide more detail (at least 10 characters)."),
  jobId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { description, jobId } = parsed.data;

  await prisma.dispute.create({
    data: {
      raisedBy: userId,
      reason: description,
      ...(jobId ? { jobId } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
