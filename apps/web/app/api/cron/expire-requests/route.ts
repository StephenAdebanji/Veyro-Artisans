import { NextResponse } from "next/server";
import { matchingRepository } from "@/services/matching/matching.repository";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await matchingRepository.expireStaleRequests();
  return NextResponse.json({ ok: true, expired });
}
