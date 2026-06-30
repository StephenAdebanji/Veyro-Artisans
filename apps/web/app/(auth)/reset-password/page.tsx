import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="">
        <p className="text-sm text-destructive">
          This password reset link is invalid or has expired.{" "}
          <a href="/forgot-password" className="text-primary underline">
            Request a new one
          </a>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account.">
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}
