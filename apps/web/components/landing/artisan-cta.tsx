import Link from "next/link";

const STATS = [
  { label: "Verified artisans", value: "12k+" },
  { label: "Match accuracy", value: "98%" },
  { label: "Average match time", value: "<60s" },
];

export function ArtisanCta() {
  return (
    <section className="flex flex-col gap-6 bg-primary px-6 py-16 text-primary-foreground md:flex-row md:items-center md:justify-between">
      <div className="max-w-md">
        <h2 className="text-2xl font-bold">Are you an artisan?</h2>
        <p className="mt-2 text-primary-foreground/80">
          Join VEYRO. Build a verified reputation, win jobs near you, and get paid securely.
        </p>
        <Link
          href="/join-artisan/steps/1"
          className="mt-4 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-primary"
        >
          Start verification →
        </Link>
      </div>
      <div className="flex gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/20 px-4 py-3 text-center">
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-primary-foreground/70">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
