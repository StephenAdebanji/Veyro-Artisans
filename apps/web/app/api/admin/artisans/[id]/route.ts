import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";
import { authRepository } from "@/services/auth/auth.repository";
import type { Role, UserStatus, SkillCategory } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "ADMIN";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const artisan = await userRepository.findArtisanProfileFull(id);
  if (!artisan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(artisan);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as { action: "suspend" | "activate" };
  const artisan = await userRepository.findArtisanProfileFull(id);
  if (!artisan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.action === "suspend") await userRepository.suspendUser(artisan.userId);
  else if (body.action === "activate") await userRepository.activateUser(artisan.userId);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const schema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["ADMIN", "ARTISAN", "HOMEOWNER"]),
    status: z.enum(["ACTIVE", "SUSPENDED"]),
    primarySkill: z.string().nullable().optional(),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const artisan = await userRepository.findArtisanProfileFull(id);
  if (!artisan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check email conflict only if it changed
  if (parsed.data.email !== artisan.user.email) {
    const existing = await authRepository.findByEmail(parsed.data.email);
    if (existing && existing.id !== artisan.userId) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  await Promise.all([
    authRepository.updateUser(artisan.userId, {
      email: parsed.data.email,
      role: parsed.data.role as Role,
      status: parsed.data.status as UserStatus,
    }),
    userRepository.updateArtisanProfile(id, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      ...(parsed.data.primarySkill ? { primarySkill: parsed.data.primarySkill as SkillCategory } : {}),
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await userRepository.deleteArtisan(id);
  return NextResponse.json({ ok: true });
}
