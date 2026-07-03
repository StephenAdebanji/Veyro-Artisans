import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  value,
  label,
  href,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  href?: string;
}) {
  const inner = (
    <>
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
        {inner}
      </Link>
    );
  }

  return <div className="rounded-xl border bg-card p-4">{inner}</div>;
}
