import { NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";

const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

/** Homeowner self-registration. Artisan registration goes through the
 * multi-step /api/artisans/onboarding flow instead (see docs/API.md). */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await authService.register({
      email: parsed.data.email,
      password: parsed.data.password,
      role: "HOMEOWNER",
    });
    await userService.createHomeownerProfile(user.id, parsed.data.fullName);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
