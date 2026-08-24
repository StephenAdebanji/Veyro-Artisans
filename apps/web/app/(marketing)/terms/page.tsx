import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review the VEYRO Terms of Service — the rules and agreements that govern your use of the VEYRO platform as a homeowner or artisan.",
  openGraph: {
    title: "Terms of Service | VEYRO",
    description:
      "Review the VEYRO Terms of Service — the rules and agreements that govern your use of the VEYRO platform as a homeowner or artisan.",
  },
};

import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of these terms",
    body: (
      <p>
        By creating an account or otherwise using VEYRO, you agree to these Terms of Use and to our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use the
        platform.
      </p>
    ),
  },
  {
    id: "the-service",
    heading: "What VEYRO is",
    body: (
      <>
        <p>
          VEYRO is a platform that connects homeowners with independent, verified artisans for home
          service jobs. VEYRO verifies identity and trade credentials and provides a Trust Score to help
          homeowners make informed decisions — but VEYRO is <strong>not</strong> the employer of any
          artisan, and does not itself perform any home repair or service work.
        </p>
        <p>
          VEYRO does not process payments. Pricing for a job is proposed by the artisan and accepted by
          the homeowner within the app, but payment is arranged and made directly between the two
          parties, outside the platform. VEYRO is not a party to that payment and bears no responsibility
          for payment disputes.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility",
    body: (
      <p>
        You must be at least 18 years old and legally capable of entering into a binding contract under
        Nigerian law to use VEYRO. By registering, you confirm that the information you provide is
        accurate and that you meet these requirements.
      </p>
    ),
  },
  {
    id: "accounts",
    heading: "Your account",
    body: (
      <ul>
        <li>You are responsible for keeping your password confidential and for all activity under your account.</li>
        <li>You must provide accurate information when registering and keep it up to date.</li>
        <li>Notify us immediately at <a href="mailto:support@veyro.app">support@veyro.app</a> if you suspect unauthorised access to your account.</li>
      </ul>
    ),
  },
  {
    id: "verification",
    heading: "Artisan verification",
    body: (
      <>
        <p>
          Artisans must submit a valid government-issued ID, proof of address, and relevant trade
          credentials for review before receiving a Verified badge. Submitting false or misleading
          documents is grounds for immediate suspension and may be reported to the relevant authorities.
        </p>
        <p>
          VEYRO reserves the right to reject, suspend, or revoke an artisan&rsquo;s verification status at
          any time if we reasonably believe the artisan no longer meets our standards.
        </p>
        <p>
          Artisans on VEYRO are independent contractors. Nothing in these Terms creates an employment,
          agency, or partnership relationship between VEYRO and any artisan.
        </p>
      </>
    ),
  },
  {
    id: "conduct",
    heading: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Provide false information during registration, onboarding, or verification.</li>
          <li>Harass, threaten, or discriminate against any other user.</li>
          <li>Attempt to circumvent VEYRO&rsquo;s matching or review process (e.g. fake reviews, fake job completions).</li>
          <li>Use the platform for any unlawful purpose.</li>
          <li>Attempt to access another user&rsquo;s account or private data without authorisation.</li>
        </ul>
        <p>Violating these terms may result in suspension or termination of your account.</p>
      </>
    ),
  },
  {
    id: "reviews",
    heading: "Reviews and Trust Score",
    body: (
      <p>
        Only a homeowner who completed a job with a specific artisan through VEYRO may leave a review for
        that job. Reviews and verification events are anchored on the blockchain to prevent tampering —
        once submitted, a review cannot be altered or deleted, including by VEYRO. An artisan&rsquo;s
        Trust Score is calculated automatically from verification status, reviews, response time, and job
        completion rate.
      </p>
    ),
  },
  {
    id: "disputes",
    heading: "Disputes between users",
    body: (
      <p>
        If a disagreement arises between a homeowner and an artisan about a job, either party may raise a
        dispute through VEYRO&rsquo;s admin review process. VEYRO will review the available information
        and may take action such as adjusting verification status, but VEYRO does not guarantee the
        outcome of any dispute and is not liable for losses arising from a job carried out between users.
      </p>
    ),
  },
  {
    id: "ip",
    heading: "Intellectual property",
    body: (
      <p>
        The VEYRO name, logo, and platform design are the property of VEYRO. Content you upload (photos,
        profile information, messages) remains yours, but by uploading it you grant VEYRO a licence to
        display it on the platform for the purpose of operating the service (e.g. showing your portfolio
        to prospective clients).
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Disclaimer and limitation of liability",
    body: (
      <>
        <p>
          VEYRO verifies artisan identity and credentials but does not guarantee the quality, safety, or
          outcome of any work performed. Jobs are carried out directly between homeowners and artisans,
          at their own risk.
        </p>
        <p>
          To the fullest extent permitted by Nigerian law, VEYRO is not liable for any indirect,
          incidental, or consequential damages arising from your use of the platform or from any job
          arranged through it.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    heading: "Suspension and termination",
    body: (
      <p>
        We may suspend or terminate your account if you violate these Terms, provide false information,
        or engage in conduct that harms other users or the platform. You may stop using VEYRO and request
        deletion of your account at any time by contacting{" "}
        <a href="mailto:support@veyro.app">support@veyro.app</a>.
      </p>
    ),
  },
  {
    id: "law",
    heading: "Governing law",
    body: (
      <p>
        These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute arising from
        these Terms or your use of VEYRO is subject to the exclusive jurisdiction of Nigerian courts.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. If we make material changes, we will notify you by
        email or through the platform before the changes take effect. Continuing to use VEYRO after a
        change takes effect means you accept the updated Terms.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about these Terms of Use? Contact us at{" "}
        <a href="mailto:support@veyro.app">support@veyro.app</a>.
      </p>
    ),
  },
];

export default function TermsOfUsePage() {
  return (
    <LegalPage
      title="Terms of Use"
      effectiveDate="1 August 2026"
      intro="These Terms of Use govern your access to and use of VEYRO. Please read them carefully."
      sections={SECTIONS}
    />
  );
}
