import Link from "next/link";
import Image from "next/image";

export function AuthLayout({
  title,
  subtitle,
  mode,
  children,
}: {
  title: string;
  subtitle: string;
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left panel — image with overlay */}
      <div className="relative hidden md:block">
        <Image
          src="/hero-artisans.png"
          alt="Verified Nigerian artisans on VEYRO"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#1E3A8A]/70" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-sm font-extrabold">
              V
            </span>
            VEYRO
          </Link>
          <div>
            <h2 className="text-3xl font-bold">Trusted hands, on demand.</h2>
            <p className="mt-2 max-w-sm text-white/80">
              Verified identity, verified credentials, verified reviews — every artisan on VEYRO is
              who they say they are.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex gap-2 text-sm">
            {mode === "sign-up" ? (
              <Link
                href="/sign-in"
                className="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted"
              >
                Already have an account? Sign in
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted"
              >
                Don&apos;t have an account? Create one
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Are you a tradesperson?{" "}
            <Link href="/join-artisan/steps/1" className="font-medium text-primary">
              Join as artisan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
