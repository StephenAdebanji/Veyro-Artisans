import { AuthLayout } from "@/components/auth/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; reset?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout title="Welcome back" subtitle="Hire trusted artisans in minutes." mode="sign-in">
      {params.registered === "1" && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Account created successfully — please sign in to continue.
        </div>
      )}
      {params.reset === "1" && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Password reset email sent — check your inbox.
        </div>
      )}
      <SignInForm />
    </AuthLayout>
  );
}
