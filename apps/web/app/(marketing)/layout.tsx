import Link from "next/link";
import { Footer } from "@/components/shared/footer";
import { MarketingNav } from "@/components/landing/marketing-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="force-light flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            V
          </span>
          VEYRO
        </Link>

        {/* Desktop nav */}
        <MarketingNav />

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 text-sm md:flex">
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
            Join as homeowner
          </Link>
          <Link href="/join-artisan/steps/1" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
            Join as artisan
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 text-sm md:hidden">
          <Link href="/sign-in" className="px-2 py-1.5 text-muted-foreground">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            Get started
          </Link>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  );
}
