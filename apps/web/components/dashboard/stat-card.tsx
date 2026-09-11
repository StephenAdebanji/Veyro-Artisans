import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const accentStyles = {
  violet: { bar: "bg-indigo-500", icon: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bar: "bg-teal-500", icon: "text-teal-600 dark:text-teal-400" },
  amber: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" },
  blue: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" },
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
