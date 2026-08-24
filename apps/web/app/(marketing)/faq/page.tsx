import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Got questions about VEYRO? Find answers about how to hire artisans, how verification works, payments, disputes, and everything in between.",
  openGraph: {
    title: "FAQ | VEYRO",
    description:
      "Got questions about VEYRO? Find answers about how to hire artisans, how verification works, payments, disputes, and everything in between.",
  },
};

type FaqItem = { q: string; a: string };

const SECTIONS: { title: string; items: FaqItem[] }[] = [
  {
    title: "General",
    items: [
      {
        q: "What is VEYRO?",
        a: "VEYRO is an online platform that connects homeowners with verified, trusted artisans across Nigeria. Whether you need a plumber, electrician, carpenter, painter, or any other skilled tradesperson, VEYRO matches you with a vetted professional in real time — with AI-driven recommendations and blockchain-backed trust records so you always know who you're hiring.",
      },
      {
        q: "Is VEYRO free to use?",
        a: "Creating an account is completely free for both homeowners and artisans. Homeowners can post jobs and receive offers at no cost. Artisans sign up and go through verification free of charge. We may introduce optional premium features in the future, but core matching and hiring will always be accessible.",
      },
      {
        q: "Which cities and states does VEYRO cover?",
        a: "VEYRO is available nationwide across Nigeria. You can post a job or create an artisan profile from any state. Our matching algorithm filters by location so you are connected with artisans who can realistically reach your address.",
      },
      {
        q: "How is VEYRO different from just asking around or using social media?",
        a: "When you hire through word-of-mouth or social media, you have no way to verify who you're really dealing with — no ID check, no credential review, no documented track record. VEYRO manually verifies every artisan's identity and qualifications before they appear on the platform, and every review is tied to a real completed job. You get a professional with a provable history, not just someone's cousin.",
      },
    ],
  },
  {
    title: "For Homeowners",
    items: [
      {
        q: "How do I post a job on VEYRO?",
        a: "Sign up as a homeowner, go to your dashboard, and tap 'New Request'. Describe the work you need done, select the category (e.g. plumbing, electrical, carpentry), and submit. Our AI system immediately starts matching your request to verified artisans in your area who have the right skills. You'll receive offers you can review and accept.",
      },
      {
        q: "How are artisans verified?",
        a: "Every artisan on VEYRO goes through a multi-step verification before they can accept jobs: government-issued ID (National ID, Voter's Card, Driver's Licence, or Passport) is reviewed by our trust team; proof of address is checked; relevant trade credentials and certificates are submitted and approved. Only after all checks pass does the artisan receive the Verified badge and appear in search results.",
      },
      {
        q: "Can I see an artisan's reviews before hiring them?",
        a: "Yes. Each artisan's profile shows their star rating and written reviews from previous homeowners. Importantly, only homeowners who actually completed a job through VEYRO can leave a review — there are no anonymous ratings and no way to post fake five-stars. Every review is also timestamped and anchored on the blockchain, so the record cannot be altered or deleted.",
      },
      {
        q: "What if I'm not satisfied with the work?",
        a: "If there is a problem with the completed work, you can raise a dispute directly from your dashboard. Our team reviews both sides and works to reach a fair resolution. We encourage clear communication within the platform chat first, but disputes are there as a formal escalation path when that's not enough.",
      },
      {
        q: "What if an artisan doesn't show up after accepting my job?",
        a: "No-shows are taken seriously on VEYRO. If an artisan accepts a job and fails to show without notice, you can report it through the dispute system. Repeat no-shows result in the artisan being suspended or permanently removed from the platform. Your job will be re-matched to another available artisan.",
      },
      {
        q: "Can I message an artisan before hiring them?",
        a: "Yes. Once an artisan sends you an offer on your job request, you can chat with them directly through the VEYRO in-app messaging system before you accept. This lets you clarify scope, timeline, and pricing without sharing your personal phone number.",
      },
    ],
  },
  {
    title: "For Artisans",
    items: [
      {
        q: "How do I join VEYRO as an artisan?",
        a: "Click 'Join as artisan' on the homepage and complete the two-step application: first your personal details and trade category, then your verification documents (government ID, proof of address, and any trade certificates). Our trust team reviews your submission — typically within 24 hours — and you'll be notified once approved. After that your profile goes live and you can start receiving job offers.",
      },
      {
        q: "What documents do I need to get verified?",
        a: "You will need: a valid government-issued ID (National ID card, Voter's Card, Driver's Licence, or International Passport), a proof of address (utility bill or bank statement dated within the last three months), and any relevant trade certificates or professional qualifications for your category. Documents are uploaded securely during the application process.",
      },
      {
        q: "How does VEYRO match me with jobs?",
        a: "When a homeowner posts a job, our AI matching engine scores all verified artisans against the request based on your skill category, your location relative to the homeowner, your trust score, and your availability. The best-matching artisans are presented to the homeowner. You can also browse open jobs in your area and send offers directly.",
      },
      {
        q: "How and when do I get paid?",
        a: "When you and a homeowner agree on a job, you set the price and terms through the offer system on VEYRO. Payment details and timing are agreed between you and the homeowner. VEYRO provides the platform for the agreement and the chat to coordinate — always keep your communication and job confirmation within the app so there is a clear record if any dispute arises.",
      },
      {
        q: "Can I work in multiple trade categories?",
        a: "Your VEYRO profile has a primary skill category, which is the main trade you will be matched and searched for. If you work across multiple trades, you can add secondary skills to your profile so homeowners with those needs can also find you.",
      },
      {
        q: "What happens to my profile if I'm inactive for a long time?",
        a: "Your profile stays active as long as your account is in good standing. We do not automatically remove artisans for inactivity. However, low responsiveness to job offers will affect your trust score over time, which may reduce how often you appear in homeowner matches.",
      },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      {
        q: "What is a trust score?",
        a: "Your trust score is a number out of 100 that reflects the strength of an artisan's verified reputation on VEYRO. It is calculated from five factors: credential completeness (35%), verified review score (25%), identity verification status (20%), job completion rate (10%), and average response time (10%). It is recalculated after every completed job and every approved credential.",
      },
      {
        q: "What does 'blockchain-anchored' mean?",
        a: "VEYRO records key trust events — identity verification approval, credential approval, and job reviews — as transactions on the Polygon blockchain through four smart contracts. Once recorded, these entries cannot be edited, deleted, or disputed by anyone, including VEYRO. This means an artisan's verified history is independently verifiable and permanent, not just stored in a database we control.",
      },
      {
        q: "How do I raise a dispute?",
        a: "Go to your dashboard, find the relevant job, and select 'Raise a dispute'. Describe the issue clearly — include dates, what was agreed, and what went wrong. Our team will review the submission and may ask for supporting evidence (photos, chat messages). You will be updated on the outcome through your dashboard notifications.",
      },
      {
        q: "How long does dispute resolution take?",
        a: "Our team aims to acknowledge all disputes within 24 hours and reach a resolution within 5 working days. Complex cases may take longer depending on the evidence involved. Both parties are kept informed throughout the process.",
      },
      {
        q: "Is my personal information safe?",
        a: "Yes. VEYRO stores all personal documents (government IDs, proof of address) securely on Cloudinary with restricted access. Your ID is never shown to homeowners — only your verification status (Verified / Unverified) is public. Passwords are hashed and never stored in plain text. We do not sell or share your data with third parties. See our Privacy Policy for the full details.",
      },
      {
        q: "What happens if an artisan is found to be fraudulent?",
        a: "If our trust team finds that an artisan submitted false documents or misrepresented their qualifications, their account is immediately suspended and the verification is revoked. Depending on the severity, the account may be permanently deleted. Affected homeowners are notified and any open jobs are re-matched.",
      },
    ],
  },
];

function FaqSection({ title, items }: { title: string; items: FaqItem[] }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      <div className="divide-y rounded-xl border">
        {items.map(({ q, a }) => (
          <details key={q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground marker:hidden focus:outline-none">
              {q}
              <span className="flex-none text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-muted-foreground">
          Everything you need to know about VEYRO. Can't find what you're looking for?{" "}
          <Link href="/sign-in" className="text-primary underline underline-offset-4">
            Contact us
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {SECTIONS.map((s) => (
          <FaqSection key={s.title} title={s.title} items={s.items} />
        ))}
      </div>

      <div className="mt-14 rounded-xl border bg-muted/40 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold">Still have questions?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Our team is here to help. Sign in and reach out through your dashboard.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/sign-up">Get started free</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
