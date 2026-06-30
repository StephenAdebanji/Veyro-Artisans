import Link from "next/link";
import { ShieldCheck, Star, FileCheck, Link2, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const LAYERS = [
  {
    icon: ShieldCheck,
    color: "bg-blue-100 text-blue-700",
    title: "Identity verification",
    body: "Every artisan submits a government-issued ID (Voters Card, National ID, Driver's Licence, or Passport) and proof of address. Our trust team manually reviews each submission before granting the Verified badge.",
    detail: "Identity documents are stored securely in Cloudinary and never shared with homeowners — only the verification status is public.",
  },
  {
    icon: FileCheck,
    color: "bg-indigo-100 text-indigo-700",
    title: "Credential verification",
    body: "Trade certificates, professional licences, and any relevant qualifications are submitted and reviewed. An artisan claiming to be an electrician must prove it — VEYRO checks, so you don't have to.",
    detail: "Credentials are reviewed by our verification team within 24 hours. Rejected submissions are flagged and the artisan is notified of what's missing.",
  },
  {
    icon: Star,
    color: "bg-amber-100 text-amber-700",
    title: "Verified reviews",
    body: "Only homeowners who completed a job with an artisan through VEYRO can leave a review. No anonymous ratings, no fake five-stars from friends, no paid reviews.",
    detail: "Reviews are tied to a specific job ID. Each review is timestamped and signed — if someone tries to delete or alter it, the blockchain record catches the discrepancy.",
  },
  {
    icon: Link2,
    color: "bg-emerald-100 text-emerald-700",
    title: "On-chain trust anchoring",
    body: "VEYRO uses four smart contracts on the Polygon blockchain to anchor every trust event permanently. Identity verification, credential approval, and reviews are recorded on-chain — creating an immutable, independently verifiable record.",
    detail: "Smart contracts: IdentityVerification, CredentialVerification, Reputation, TrustScore — all deployed on Polygon and auditable by anyone.",
  },
];

const TRUST_SCORE_FACTORS = [
  { label: "Credential completeness", weight: "35%", description: "How many required credentials have been submitted and approved" },
  { label: "Identity verification", weight: "20%", description: "Whether government ID and proof of address have been verified" },
  { label: "Review score", weight: "25%", description: "Weighted average of star ratings from completed jobs" },
  { label: "Response time", weight: "10%", description: "Average time to respond to homeowner enquiries" },
  { label: "Job completion rate", weight: "10%", description: "Percentage of accepted jobs completed successfully" },
];

const COMPARED = [
  { aspect: "Identity check", veyro: "Manual review of government ID", others: "Self-declaration or none" },
  { aspect: "Credentials", veyro: "Reviewed and approved by trust team", others: "Self-reported, unverified" },
  { aspect: "Reviews", veyro: "Job-tied, blockchain-anchored", others: "Anyone can post, easily manipulated" },
  { aspect: "Dispute resolution", veyro: "Structured admin dispute process", others: "No formal process" },
  { aspect: "Accountability", veyro: "On-chain record, permanently visible", others: "Platform-dependent, can be deleted" },
];

export default function TrustPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-[#1E3A8A] px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            Trust & Safety
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Trust on VEYRO isn't a promise.<br />
            <span className="text-blue-300">It's a system.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Verified identity. Verified credentials. Verified reviews — anchored permanently on the
            blockchain. Every artisan on VEYRO has passed a rigorous, multi-layer verification
            process before they can work.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-white text-[#1E3A8A] hover:bg-blue-50">
              <Link href="/sign-up">Get started — it's free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="bg-muted/40 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-3">
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-600" />
            <div>
              <h2 className="text-xl font-bold">Why trust is broken in home services</h2>
              <p className="mt-3 text-muted-foreground">
                In Nigeria, most homeowners find artisans through WhatsApp groups, social media recommendations,
                or word of mouth — with no way to verify who they're actually hiring. Fake reviews are rampant
                on generic listing platforms. Credentials are self-reported and unverifiable. There is no system
                of accountability when something goes wrong.
              </p>
              <p className="mt-3 text-muted-foreground">
                VEYRO was built specifically to fix this. We don't just ask artisans to describe themselves —
                we verify who they are, check what they're qualified to do, and record their track record in
                a way that no one can alter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Four layers of trust */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold">Four layers of verification</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Trust on VEYRO is built in layers — each one independently meaningful, together forming
            a complete picture of an artisan's trustworthiness.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {LAYERS.map(({ icon: Icon, color, title, body, detail }) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <div className={`inline-flex rounded-lg p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust score breakdown */}
      <section className="bg-[#1E3A8A]/5 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold">How the Trust Score is calculated</h2>
          <p className="mt-2 text-muted-foreground">
            Every artisan on VEYRO has a Trust Score between 0 and 100. It's a composite of five
            factors, each weighted by how predictive it is of a positive homeowner experience.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium">Factor</th>
                  <th className="px-4 py-3 text-left font-medium">Weight</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">What it measures</th>
                </tr>
              </thead>
              <tbody>
                {TRUST_SCORE_FACTORS.map(({ label, weight, description }) => (
                  <tr key={label} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{label}</td>
                    <td className="px-4 py-3 text-[#1E3A8A] font-bold">{weight}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Trust Scores are recalculated automatically after every credential review, job completion, and new review.
          </p>
        </div>
      </section>

      {/* VEYRO vs others */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold">VEYRO vs other platforms</h2>
          <div className="mt-6 overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium">Aspect</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1E3A8A]">VEYRO</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Others</th>
                </tr>
              </thead>
              <tbody>
                {COMPARED.map(({ aspect, veyro, others }) => (
                  <tr key={aspect} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{aspect}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{veyro}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Blockchain explainer */}
      <section className="bg-muted/40 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start gap-4">
            <Zap className="mt-1 h-8 w-8 shrink-0 text-[#1E3A8A]" />
            <div>
              <h2 className="text-xl font-bold">Why blockchain?</h2>
              <p className="mt-3 text-muted-foreground">
                Traditional databases are controlled by whoever runs the platform. Reviews can be
                deleted. Verification records can be altered. Platform incentives don't always align
                with user interests.
              </p>
              <p className="mt-3 text-muted-foreground">
                By anchoring trust records on the Polygon blockchain, VEYRO makes manipulation
                structurally impossible. The smart contracts are public and open-source — anyone can
                verify that the on-chain record matches what VEYRO displays. If VEYRO ever
                misrepresented a verification status, the discrepancy would be publicly visible.
              </p>
              <p className="mt-3 text-sm font-medium">
                This is what "verified" means on VEYRO — not a badge, but a provable fact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold">Ready to hire with confidence?</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Every artisan on VEYRO has been verified. Every review is real. Every record is permanent.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90">
            <Link href="/sign-up">Find a verified artisan</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/join-artisan/steps/1">Get verified as an artisan</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
