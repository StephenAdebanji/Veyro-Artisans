import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { prisma } from "@/platform/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!userId || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, email } = parsed.data;

  if (email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict && conflict.id !== userId) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...(name !== undefined && { name }), ...(email !== undefined && { email }) },
    select: { name: true, email: true },
  });

  return NextResponse.json(updated);
}
