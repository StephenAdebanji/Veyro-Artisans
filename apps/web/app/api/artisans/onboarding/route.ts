import { NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";
import { ApiError } from "@/platform/api-error";
import { withApiErrorHandling } from "@/platform/api-handler";

const basicInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
});

/** Step 1 of the artisan onboarding wizard: creates the auth.User (role=ARTISAN)
 * and a draft user.ArtisanProfile, then returns the artisanId every subsequent
 * PATCH .../onboarding/:id call targets. */
export const POST = withApiErrorHandling(async (request: Request) => {
  const body = await request.json();
  const parsed = basicInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let user;
  try {
    user = await authService.register({
      email: parsed.data.email,
      phone: parsed.data.phone,
      password: parsed.data.password,
      role: "ARTISAN",
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Registration failed", 409);
  }

  const artisanId = await userService.createArtisanDraft(user.id);
  await userService.updateArtisanOnboardingStep(artisanId, 1, {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
  });

  return NextResponse.json({ artisanId }, { status: 201 });
});
