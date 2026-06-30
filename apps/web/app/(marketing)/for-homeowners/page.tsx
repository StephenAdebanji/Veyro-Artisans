import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck, Star, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Zap,
    title: "Post your job in 60 seconds",
    body: "Describe what you need — plumbing, electrical, painting, tiling, or anything else around the home. Set your budget and location. No phone calls, no haggling.",
  },
  {
    icon: ShieldCheck,
    title: "Get matched with verified artisans",
    body: "VEYRO's AI engine ranks the best artisans for your job based on skill match, proximity, experience, and trust score. Every artisan on the platform has passed identity and credential verification.",
  },
  {
    icon: MessageSquare,
    title: "Review offers and chat directly",
    body: "Artisans send you their offer — price, timeline, and a short pitch. Ask questions in real-time chat before you commit. No middlemen, no hidden fees.",
  },
  {
    icon: Star,
    title: "Rate and review after the job",
    body: "Once your job is done, leave a review. Every rating is stored on-chain — it can never be deleted or manipulated, keeping the artisan community honest.",
  },
];

const PAIN_POINTS = [
  "Hired an artisan who disappeared after taking a deposit",
  "Paid too much because you didn't know the market rate",
  "Wasted days trying to find someone reliable by word of mouth",
  "Couldn't verify if an artisan's credentials were real",
];

const PROMISES = [
  { icon: ShieldCheck, text: "Every artisan is identity-verified before they can accept jobs" },
  { icon: CheckCircle2, text: "Credentials — trade certificates, licences — reviewed and approved by our trust team" },
  { icon: Star, text: "Reviews are immutable and anchored on the blockchain — no fake ratings" },
  { icon: Clock, text: "Average response time from artisans is under 10 minutes" },
];

export default function ForHomeownersPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-[#1E3A8A] px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            For Homeowners
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Stop worrying about who to trust.<br />
            <span className="text-blue-300">VEYRO handles that for you.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Finding a reliable artisan in Nigeria shouldn't feel like a gamble. VEYRO connects you
            with skilled, verified tradespeople near you — with real reviews, real credentials, and
            real accountability.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-[#1E3A8A] hover:bg-blue-50">
              <Link href="/sign-up">Get started free</Link>
            </Button>
            <Button asChild size="lg" className="bg-white/20 text-white border border-white hover:bg-white/30">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold">Sound familiar?</h2>
          <p className="mt-2 text-center text-muted-foreground">
            You're not alone. These are the most common complaints we hear from Nigerian homeowners.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {PAIN_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <span className="mt-0.5 text-destructive">✕</span>
                <span className="text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold">How VEYRO works for homeowners</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-white font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust promises */}
      <section className="bg-[#1E3A8A]/5 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold">Our promise to you</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Every artisan on VEYRO goes through a rigorous verification process before they can work.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PROMISES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold">Ready to find a trusted artisan?</h2>
        <p className="mt-3 text-muted-foreground">
          Join thousands of homeowners who have already discovered a better way to hire.
        </p>
        <Button asChild size="lg" className="mt-6 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90">
          <Link href="/sign-up">Post your first job — it's free</Link>
        </Button>
      </section>
    </div>
  );
}
