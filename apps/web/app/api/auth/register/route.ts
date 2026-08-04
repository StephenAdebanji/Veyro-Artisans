import { NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";
import { ApiError } from "@/platform/api-error";
import { withApiErrorHandling } from "@/platform/api-handler";

const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1).optional(),
  password: z.string().min(8),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().min(1),
});

/** Homeowner self-registration. Artisan registration goes through the
 * multi-step /api/artisans/onboarding flow instead (see docs/API.md). */
export const POST = withApiErrorHandling(async (request: Request) => {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let user;
  try {
    user = await authService.register({
      email: parsed.data.email,
      password: parsed.data.password,
      role: "HOMEOWNER",
    });
  } catch (error) {
    // authService.register throws "Email already registered" — a conflict, not
    // a generic 400. Translate explicitly rather than letting the wrapper's
    // default 400-for-plain-Error handling apply.
    throw new ApiError(error instanceof Error ? error.message : "Registration failed", 409);
  }

  await userService.createHomeownerProfile(user.id, parsed.data.fullName, parsed.data.phone, {
    address: parsed.data.address,
    city: parsed.data.city,
    state: parsed.data.state,
  });
  return NextResponse.json({ user }, { status: 201 });
});
