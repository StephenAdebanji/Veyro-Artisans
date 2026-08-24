import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/platform/auth-session";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";
import { userRepository } from "@/services/user/user.repository";
import { withApiErrorHandling } from "@/platform/api-handler";

const deleteSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const DELETE = withApiErrorHandling(async (request: Request) => {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const userId = sessionUser?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (sessionUser?.role === "ADMIN") {
    return NextResponse.json({ error: "Admin accounts cannot be self-deleted." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const user = await authService.getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (parsed.data.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
    return NextResponse.json({ error: "Email confirmation does not match your account email." }, { status: 400 });
  }

  if (user.role === "HOMEOWNER") {
    const homeowner = await userService.getHomeownerProfileByUserId(userId);
    if (homeowner) {
      await userRepository.deleteHomeowner(homeowner.id, "Deleted by account holder");
    }
  } else if (user.role === "ARTISAN") {
    const artisan = await userService.getArtisanProfileByUserId(userId);
    if (artisan) {
      await userRepository.deleteArtisan(artisan.id, "Deleted by account holder");
    }
  }

  return NextResponse.json({ ok: true });
});
