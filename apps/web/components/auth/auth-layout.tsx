import Link from "next/link";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-primary/70 p-10 text-primary-foreground md:flex">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-sm">
            V
          </span>
          VEYRO
        </Link>
        <div>
          <h2 className="text-3xl font-bold">Trusted hands, on demand.</h2>
          <p className="mt-2 max-w-sm text-primary-foreground/80">
            Verified identity, verified credentials, verified reviews — every artisan on VEYRO is
            who they say they are.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex gap-2 text-sm">
            <Link
              href="/sign-in"
              className="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted"
            >
              Create account
            </Link>
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
