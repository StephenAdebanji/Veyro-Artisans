import { Search, ShieldCheck, Zap } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Describe the job",
    description: "Tell us the skill you need. Our AI understands context, urgency and budget.",
  },
  {
    icon: Zap,
    title: "Real-time matching",
    description: "Verified artisans nearby respond live — competing for the right to serve you.",
  },
  {
    icon: ShieldCheck,
    title: "Hire with confidence",
    description: "Every artisan is identity-verified, credentialed and reputation-scored on-chain.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/40 px-6 py-16">
      <p className="text-sm font-medium text-primary">HOW VEYRO WORKS</p>
      <h2 className="mt-1 max-w-md text-3xl font-bold tracking-tight">
        Request. Match. Hire — with trust built in.
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.title} className="rounded-xl border bg-card p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <step.icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
