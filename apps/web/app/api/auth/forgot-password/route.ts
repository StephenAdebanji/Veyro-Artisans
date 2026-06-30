import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/platform/prisma";

const schema = z.object({ email: z.string().email() });

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return 200 — don't reveal whether the email exists
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@veyro.app",
      to: user.email,
      subject: "Reset your VEYRO password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1E3A8A">Reset your password</h2>
          <p>We received a request to reset the password for your VEYRO account.</p>
          <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1E3A8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
            Reset password
          </a>
          <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#888;font-size:12px">VEYRO — Connecting Homes with Trusted Hands</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
