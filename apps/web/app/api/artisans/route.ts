import { NextResponse } from "next/server";
import type { SkillCategory } from "@veyro/contracts";
import { userService } from "@/services/user/user.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const radiusKm = url.searchParams.get("radiusKm");

  const candidates = await userService.getArtisanCandidates({
    category: category ? (category as SkillCategory) : undefined,
    near: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    radiusKm: radiusKm ? Number(radiusKm) : undefined,
  });

  return NextResponse.json({ artisans: candidates });
}
