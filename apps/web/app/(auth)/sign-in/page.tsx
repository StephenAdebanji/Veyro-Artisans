import { AuthLayout } from "@/components/auth/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";
import { IdleReasonBanner } from "@/components/auth/idle-reason-banner";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; reset?: string; reason?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout title="Welcome back" subtitle="Hire trusted artisans in minutes." mode="sign-in">
      {params.registered === "1" && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          🎉 You&apos;re in! Welcome to VEYRO — sign in below to get started.
        </div>
      )}
      {params.reset === "1" && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          🔐 New password set! Sign in below and you&apos;re good to go.
        </div>
      )}
      <IdleReasonBanner reason={params.reason} />
      <SignInForm reason={params.reason} />
    </AuthLayout>
  );
}
