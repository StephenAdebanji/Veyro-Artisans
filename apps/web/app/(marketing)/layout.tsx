import Link from "next/link";
import { Footer } from "@/components/shared/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            V
          </span>
          VEYRO
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/for-homeowners">For homeowners</Link>
          <Link href="/for-artisans">For artisans</Link>
          <Link href="/trust">Trust</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/sign-in">Sign in</Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground"
          >
            Join as homeowner
          </Link>
          <Link
            href="/join-artisan/steps/1"
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground"
          >
            Join as artisan
          </Link>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  );
}
