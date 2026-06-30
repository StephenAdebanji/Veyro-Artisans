import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategorySearch } from "@/components/landing/category-search";

export function Hero() {
  return (
    <section className="grid gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
      <div className="flex flex-col gap-5">
        <Badge variant="secondary" className="w-fit gap-1.5">
          <Sparkles className="size-3.5" /> AI-powered artisan matching
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Who are you looking to hire today?
        </h1>
        <p className="max-w-md text-muted-foreground">
          VEYRO matches homeowners with verified, trusted artisans in real time. Every profile,
          credential and review is independently verified.
        </p>

        <CategorySearch />

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600" /> Verified identity
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600" /> Verified credentials
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-4 text-amber-500" /> Verified reviews
          </span>
        </div>
      </div>

      <div className="relative">
        <Image
          src="/hero-artisans.png"
          alt="Verified Nigerian artisans on VEYRO"
          width={800}
          height={600}
          className="rounded-2xl object-cover w-full"
          priority
        />
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border bg-card px-4 py-3 shadow-lg md:left-auto md:right-4 md:translate-x-0">
          <p className="text-xs font-medium text-muted-foreground">MATCH FOUND</p>
          <p className="text-sm font-semibold">3 artisans responded in 14s</p>
        </div>
        <div className="absolute bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-lg md:left-4 md:translate-x-0">
          <div>
            <p className="text-sm font-semibold">Emeka Okafor</p>
            <p className="text-xs text-muted-foreground">Electrician · 1.2 km · ETA 12 min</p>
          </div>
          <Badge className="bg-primary/10 text-primary">96/100</Badge>
        </div>
      </div>
    </section>
  );
}
