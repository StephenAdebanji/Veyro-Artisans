import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { geocodeAddress } from "@/platform/mapbox";

const editSchema = z.object({
  bio: z.string().optional(),
  serviceRadiusKm: z.number().positive().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
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

  const { city, state, ...rest } = parsed.data;

  // Geocode city+state so dashboard location-based counts stay accurate.
  let gpsLat: number | undefined;
  let gpsLng: number | undefined;
  if (city || state) {
    const parts = [city, state, "Nigeria"].filter(Boolean).join(", ");
    const geo = await geocodeAddress(parts);
    if (geo) {
      gpsLat = geo.lat;
      gpsLng = geo.lng;
    }
  }

  await userService.updateArtisanSettings(id, { ...rest, city, state, gpsLat, gpsLng });

  return NextResponse.json({ ok: true });
}
