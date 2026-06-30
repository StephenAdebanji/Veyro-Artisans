import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t px-6 py-8 text-sm text-muted-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">
            V
          </span>
          VEYRO
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/for-homeowners">For homeowners</Link>
          <Link href="/for-artisans">For artisans</Link>
          <Link href="/trust">Trust</Link>
        </nav>
        <p>© {new Date().getFullYear()} VEYRO. Connecting Homes with Trusted Hands.</p>
      </div>
    </footer>
  );
}
