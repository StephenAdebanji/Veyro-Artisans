import { NextResponse } from "next/server";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";

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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await userRepository.deleteArtisan(id);
  return NextResponse.json({ ok: true });
}
