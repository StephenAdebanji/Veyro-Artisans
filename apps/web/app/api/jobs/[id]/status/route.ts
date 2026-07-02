import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";

const schema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ARTISAN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artisan = await userService.getArtisanProfileByUserId(user.id);
  if (!artisan) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    await matchingService.updateJobStatus(jobId, artisan.id, parsed.data.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
