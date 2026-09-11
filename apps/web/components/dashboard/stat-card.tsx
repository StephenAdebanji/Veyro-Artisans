import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const accentStyles = {
  violet: { bar: "bg-violet-500", icon: "text-violet-600 dark:text-violet-400" },
  emerald: { bar: "bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" },
  amber: { bar: "bg-amber-500", icon: "text-amber-600 dark:text-amber-400" },
  blue: { bar: "bg-blue-500", icon: "text-blue-600 dark:text-blue-400" },
} as const;

type Accent = keyof typeof accentStyles;

export function StatCard({
  icon: Icon,
  value,
  label,
  href,
  accent,
}: {
  icon: LucideIcon;
  value: string | number | ReactNode;
  label: string;
  href?: string;
  accent?: Accent;
}) {
  const styles = accent ? accentStyles[accent] : null;

  const inner = (
    <>
      {styles && <div className={`absolute inset-x-0 top-0 h-1 rounded-t-xl ${styles.bar}`} />}
      <Icon className={`size-5 ${styles ? styles.icon : "text-primary"}`} />
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="relative block overflow-hidden rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
        {inner}
      </Link>
    );
  }

  return <div className="relative overflow-hidden rounded-xl border bg-card p-4">{inner}</div>;
}
