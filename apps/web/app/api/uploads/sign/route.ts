import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { createSignedUpload } from "@/platform/cloudinary";

const UPLOAD_TYPES = [
  "profile-photo",
  "id-document",
  "proof-of-address",
  "credential",
  "portfolio",
] as const;

const signSchema = z.object({ uploadType: z.enum(UPLOAD_TYPES) });

/** Scopes every signed upload to the CALLER's own id (from the session), never
 * client-supplied — this is what stops a homeowner from signing an upload into
 * another artisan's credential folder. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ownerId = (session.user as { id?: string }).id ?? "unknown";
  const folder = `veyro/${parsed.data.uploadType}/${ownerId}`;
  const signedUpload = createSignedUpload(folder);

  return NextResponse.json(signedUpload);
}
