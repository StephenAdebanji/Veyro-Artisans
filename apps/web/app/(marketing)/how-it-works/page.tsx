import Link from "next/link";
import { CheckCircle2, MessageSquare, Search, ShieldCheck, Star, UserCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOMEOWNER_STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Post your request",
    body: "Describe what you need — plumbing, electrical, tiling, painting, AC repair, or any of 40 trades. Set your location and budget. Takes under 60 seconds.",
  },
  {
    number: "02",
    icon: Zap,
    title: "Get matched instantly",
    body: "VEYRO's AI engine scores every eligible artisan on skill match, proximity, experience, and trust score — and surfaces the best three for your specific job.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Review offers and chat",
    body: "Each artisan sends you an offer with their price and availability. Chat with them directly in real time before you commit. No middlemen, no hidden fees.",
  },
  {
    number: "04",
    icon: Star,
    title: "Hire, then review",
    body: "Accept the offer you like. Once the job is done, leave a verified review. Your rating is tied to the actual job and stored permanently on the blockchain.",
  },
];

const ARTISAN_STEPS = [
  {
    number: "01",
    icon: UserCheck,
    title: "Create your profile",
    body: "Sign up and complete the onboarding — basic info, trade skills, service area, work portfolio, and availability. Your profile is your storefront.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Get verified",
    body: "Submit your government-issued ID, proof of address, and trade credentials. Our trust team reviews and approves your profile — typically within 24 hours.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Receive live job alerts",
    body: "When a homeowner posts a job that matches your skills and location, you see it instantly on your dashboard. Submit your offer before other artisans — speed wins.",
  },
  {
    number: "04",
    icon: Star,
    title: "Build your reputation",
    body: "Every completed job adds a verified review to your profile — anchored on the blockchain and impossible to fake or delete. Your reputation becomes your competitive edge.",
  },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Every artisan is manually identity-verified before they can accept jobs" },
  { icon: CheckCircle2, text: "Trade credentials reviewed and approved by our trust team" },
  { icon: Star, text: "Reviews are tied to real jobs and anchored on the Polygon blockchain" },
  { icon: Zap, text: "Four on-chain smart contracts make every trust record independently verifiable" },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-[#1E3A8A] px-6 py-20 text-white text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            How it works
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Request. Match. Hire.
          </h1>
          <p className="mt-4 text-lg text-blue-100">
            With trust built in at every step.
          </p>
        </div>
      </section>

      {/* For homeowners */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">For homeowners</p>
          <h2 className="mt-1 text-2xl font-bold">Find and hire a verified artisan in minutes</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {HOMEOWNER_STEPS.map(({ number, icon: Icon, title, body }) => (
              <div key={number} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-white font-bold text-sm">
                    {number}
                  </div>
                  <div className="mt-2 w-px flex-1 bg-border" />
                </div>
                <div className="pb-8">
                  <Icon className="mb-2 h-5 w-5 text-[#1E3A8A]" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-2 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90">
            <Link href="/sign-up">Post your first job — free</Link>
          </Button>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t" />

      {/* For artisans */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">For artisans</p>
          <h2 className="mt-1 text-2xl font-bold">Get verified, get found, get hired</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {ARTISAN_STEPS.map(({ number, icon: Icon, title, body }) => (
              <div key={number} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-white font-bold text-sm">
                    {number}
                  </div>
                  <div className="mt-2 w-px flex-1 bg-border" />
                </div>
                <div className="pb-8">
                  <Icon className="mb-2 h-5 w-5 text-[#1E3A8A]" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-2 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90">
            <Link href="/join-artisan/steps/1">Create your artisan profile</Link>
          </Button>
        </div>
      </section>

      {/* Trust section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold">Trust is built in — not bolted on</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Every step of the VEYRO process is designed around accountability. You never have to
            wonder if the artisan is who they say they are.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/trust" className="text-sm font-medium text-primary hover:underline">
              Learn more about trust on VEYRO →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1E3A8A] px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-extrabold">Ready to get started?</h2>
        <p className="mt-3 text-blue-100 max-w-xl mx-auto">
          Join homeowners and artisans across Nigeria building a better, more trusted way to work together.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="bg-white text-[#1E3A8A] hover:bg-blue-50">
            <Link href="/sign-up">I need an artisan</Link>
          </Button>
          <Button asChild size="lg" className="bg-white/20 text-white border border-white hover:bg-white/30">
            <Link href="/join-artisan/steps/1">I am an artisan</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
