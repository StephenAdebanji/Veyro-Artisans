import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";
import { authRepository } from "@/services/auth/auth.repository";
import type { Role, UserStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "ADMIN";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as { action: "suspend" | "activate" };
  const homeowner = await userRepository.findHomeownerProfile(id);
  if (!homeowner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.action === "suspend") await userRepository.suspendUser(homeowner.userId);
  else if (body.action === "activate") await userRepository.activateUser(homeowner.userId);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const schema = z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["ADMIN", "ARTISAN", "HOMEOWNER"]),
    status: z.enum(["ACTIVE", "SUSPENDED"]),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const homeowner = await userRepository.findHomeownerProfileFull(id);
  if (!homeowner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.email !== homeowner.user.email) {
    const existing = await authRepository.findByEmail(parsed.data.email);
    if (existing && existing.id !== homeowner.userId) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  await Promise.all([
    authRepository.updateUser(homeowner.userId, {
      email: parsed.data.email,
      name: parsed.data.fullName,
      role: parsed.data.role as Role,
      status: parsed.data.status as UserStatus,
    }),
    userRepository.updateHomeownerProfile(homeowner.userId, { fullName: parsed.data.fullName }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await userRepository.deleteHomeowner(id);
  return NextResponse.json({ ok: true });
}
