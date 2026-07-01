import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { trustService } from "@/services/trust/trust.service";
import { userRepository } from "@/services/user/user.repository";
import type { CredentialType } from "@prisma/client";

const body = z.object({
  type: z.string().min(1),
  fileUrl: z.string().url(),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artisan = await userService.getArtisanProfileByUserId(userId);
  if (!artisan) return NextResponse.json({ error: "Artisan profile not found" }, { status: 404 });

  const parsed = body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const credentialId = await trustService.submitCredential({
    artisanId: artisan.id,
    type: parsed.data.type as CredentialType,
    fileUrl: parsed.data.fileUrl,
  });

  // If previously rejected, reset to pending review so it re-enters the verification queue
  if (artisan.verificationStatus === "REJECTED") {
    await userRepository.updateArtisanProfile(artisan.id, { verificationStatus: "UNVERIFIED" });
  }

  return NextResponse.json({ credentialId }, { status: 201 });
}
