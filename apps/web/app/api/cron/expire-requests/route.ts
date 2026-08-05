import { NextResponse } from "next/server";
import { matchingRepository } from "@/services/matching/matching.repository";
import { withApiErrorHandling } from "@/platform/api-handler";

/** Vercel Cron Jobs invoke scheduled routes via GET (see vercel.json's
 * `crons` entry for this path) — POST is kept too for manual triggers or a
 * different scheduler. */
const handler = withApiErrorHandling(async (req: Request) => {
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
});

export const GET = handler;
export const POST = handler;
