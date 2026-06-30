import Link from "next/link";
import { Briefcase, ShieldCheck, Star, TrendingUp, Zap, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  {
    icon: Briefcase,
    title: "Jobs come to you",
    body: "Homeowners post requests directly on VEYRO. You see live job alerts matching your skills and location — no cold calling, no door knocking, no referral dependency.",
  },
  {
    icon: ShieldCheck,
    title: "Your verification becomes your reputation",
    body: "Get your identity and trade credentials verified once. VEYRO displays your verified badge on your profile — homeowners trust verified artisans more and are willing to pay higher rates.",
  },
  {
    icon: Star,
    title: "Build a permanent portfolio of trust",
    body: "Every completed job adds a verified review to your profile. Reviews are anchored on the blockchain and can never be deleted or faked — your reputation is truly yours.",
  },
  {
    icon: TrendingUp,
    title: "AI-powered job matching",
    body: "VEYRO's recommendation engine surfaces you to homeowners whose jobs match your exact skills, experience level, and service area — so you spend less time on irrelevant enquiries.",
  },
  {
    icon: Zap,
    title: "Respond in real time",
    body: "When a homeowner posts a job that matches your skills, you see it instantly on your dashboard. Submit your offer before other artisans — speed wins jobs.",
  },
  {
    icon: Wallet,
    title: "Transparent pricing, no hidden fees",
    body: "State your price when you submit an offer. Homeowners see exactly what they're paying and why. No platform markups, no ambiguous quotes — just honest trades.",
  },
];

const STEPS = [
  { step: "1", title: "Create your profile", body: "Sign up and complete the 8-step artisan onboarding — basic info, skills, location, verification documents, credentials, portfolio, and availability." },
  { step: "2", title: "Get verified", body: "Upload your government ID, proof of address, and trade certificates. Our trust team reviews and approves your profile — usually within 24 hours." },
  { step: "3", title: "Set your availability", body: "Tell VEYRO when and where you work. You'll only receive job alerts during your available hours, in your service area." },
  { step: "4", title: "Submit offers and win jobs", body: "When a matching job is posted, submit your offer directly to the homeowner. If they accept, you're connected on the chat to arrange the details." },
];

export default function ForArtisansPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-[#1E3A8A] px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            For Artisans
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Your skills deserve to be<br />
            <span className="text-blue-300">seen, trusted, and rewarded.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            VEYRO gives skilled Nigerian tradespeople a verified digital presence — so homeowners
            find you by your merit, not by who you know. No more chasing referrals. Build your
            reputation once, and let it work for you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-[#1E3A8A] hover:bg-blue-50">
              <Link href="/join-artisan/steps/1">Join as an artisan</Link>
            </Button>
            <Button asChild size="lg" className="bg-white/20 text-white border border-white hover:bg-white/30">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold">Why artisans choose VEYRO</h2>
          <p className="mt-2 text-center text-muted-foreground">
            We built VEYRO with one goal: to give skilled artisans a fair chance to compete on
            merit, not connections.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border bg-card p-5">
                <Icon className="h-6 w-6 text-[#1E3A8A]" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold">Getting started takes less than 10 minutes</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {STEPS.map(({ step, title, body }) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-white font-bold text-lg">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold">Start winning jobs on your terms.</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Join a growing community of verified Nigerian artisans building their reputation the right way.
          Registration is free — always.
        </p>
        <Button asChild size="lg" className="mt-6 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90">
          <Link href="/join-artisan/steps/1">Create your artisan profile</Link>
        </Button>
      </section>
    </div>
  );
}
