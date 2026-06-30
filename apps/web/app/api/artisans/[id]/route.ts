import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";

const editSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  bio: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  serviceRadiusKm: z.number().positive().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  availableNow: z.boolean().optional(),
});

/** Public artisan profile. residentialAddress/gps are stripped unless the
 * requester is an authenticated admin — see UserServicePort.getArtisanProfile. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const profile = await userService.getArtisanProfile(id, { includePrivate: isAdmin });
  if (!profile) {
    return NextResponse.json({ error: "Artisan not found" }, { status: 404 });
  }

  return NextResponse.json({ artisan: profile });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await userService.getArtisanProfile(id, { includePrivate: true });
  if (!profile || (profile as { userId?: string }).userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { availableNow, ...profileFields } = parsed.data;
  await userService.updateArtisanOnboardingStep(id, 0, profileFields);

  return NextResponse.json({ ok: true });
}
