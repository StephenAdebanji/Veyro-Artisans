import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";
import { authRepository } from "@/services/auth/auth.repository";
import { withApiErrorHandling } from "@/platform/api-handler";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "ADMIN";
}

const schema = z.object({ password: z.string().min(8) });

export const POST = withApiErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const artisan = await userRepository.findArtisanProfileFull(id);
  if (!artisan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await authRepository.setPassword(artisan.userId, passwordHash);

  return NextResponse.json({ ok: true });
});
