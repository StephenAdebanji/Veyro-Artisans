import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <>
        <p>
          VEYRO (&ldquo;VEYRO&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a platform that
          connects homeowners in Nigeria with verified artisans (electricians, plumbers, carpenters,
          and similar tradespeople). This Privacy Policy explains what personal data we collect, why
          we collect it, how it is protected, and the rights you have over it, in line with the{" "}
          <strong>Nigeria Data Protection Regulation (NDPR)</strong> and the Nigeria Data Protection Act
          2023.
        </p>
        <p>
          By creating an account or using VEYRO, you consent to the collection and use of your
          information as described in this policy.
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    heading: "Information we collect",
    body: (
      <>
        <p>We only collect data that is necessary to operate the platform and serve you. Specifically:</p>
        <ul>
          <li>
            <strong>Account information</strong> — full name, email address, phone number, and a securely
            hashed password (we never store your password in plain text).
          </li>
          <li>
            <strong>Homeowner data</strong> — the address and GPS location of each service request you
            post, so nearby artisans can be matched to you.
          </li>
          <li>
            <strong>Artisan profile data</strong> — trade/skill category, experience level, bio, service
            area (GPS radius), availability, and portfolio photos of past work.
          </li>
          <li>
            <strong>Verification documents</strong> — a government-issued ID (Voter&rsquo;s Card,
            National ID, Driver&rsquo;s Licence, or Passport), proof of address, and any trade
            certificates you submit for identity and credential verification.
          </li>
          <li>
            <strong>Communications</strong> — messages exchanged between homeowners and artisans through
            VEYRO&rsquo;s chat feature, and any support requests you send us.
          </li>
          <li>
            <strong>Usage data</strong> — sign-in timestamps, session cookies used to keep you logged in,
            and basic device/browser information collected automatically for security purposes.
          </li>
          <li>
            <strong>Derived data</strong> — your Trust Score, ratings/reviews tied to completed jobs, and
            AI-generated match recommendations, all computed from the data above.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect card numbers, bank details, or other payment credentials —
          VEYRO does not process payments; pricing for a job is agreed directly between the homeowner and
          artisan.
        </p>
      </>
    ),
  },
  {
    id: "how-we-collect",
    heading: "How we collect it",
    body: (
      <ul>
        <li>Directly from you, when you register, complete artisan onboarding, or post a service request.</li>
        <li>Automatically, via cookies strictly necessary to keep you signed in — VEYRO does not use third-party advertising or tracking cookies.</li>
        <li>From your device, when you grant location access to improve matching accuracy.</li>
      </ul>
    ),
  },
  {
    id: "legal-basis",
    heading: "Consent and lawful basis for processing",
    body: (
      <>
        <p>
          In line with NDPR&rsquo;s principle of lawfulness, we process your personal data only where we
          have a valid legal basis:
        </p>
        <ul>
          <li>
            <strong>Your consent</strong> — given when you register and agree to this Privacy Policy and
            our <Link href="/terms">Terms of Use</Link>. You may withdraw consent at any time by
            contacting us, though this may limit your ability to use parts of the platform.
          </li>
          <li>
            <strong>Performance of a contract</strong> — processing needed to create your account, match
            you with an artisan/homeowner, and facilitate a job.
          </li>
          <li>
            <strong>Legal obligation</strong> — where retention or disclosure is required by Nigerian law.
          </li>
          <li>
            <strong>Legitimate interest</strong> — fraud prevention, platform security, and improving the
            quality of matches, always balanced against your right to privacy.
          </li>
        </ul>
        <p>
          Verification documents (ID, proof of address, credentials) are collected only with your
          explicit, separate consent during artisan onboarding, and are used solely for identity and
          credential verification.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    heading: "How we use your data",
    body: (
      <ul>
        <li>To create and manage your account and authenticate you when you sign in.</li>
        <li>To match homeowners with nearby, relevant artisans based on trade, location, and availability.</li>
        <li>To verify artisan identity and credentials before granting a Verified badge.</li>
        <li>To calculate Trust Scores from completed jobs, reviews, and response times.</li>
        <li>To rank artisan offers using AI (see &ldquo;Third parties&rdquo; below) for a homeowner&rsquo;s specific request.</li>
        <li>To enable in-app chat between a homeowner and the artisan they&rsquo;re working with.</li>
        <li>To send you transactional emails (e.g. password resets, offer notifications) — never marketing emails without your consent.</li>
        <li>To detect fraud, abuse, and violations of our <Link href="/terms">Terms of Use</Link>.</li>
        <li>To comply with legal obligations under Nigerian law.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    heading: "Who we share it with",
    body: (
      <>
        <p>
          We do <strong>not sell</strong> your personal data to anyone. We share data only as needed to
          run the platform:
        </p>
        <ul>
          <li>
            <strong>With the other party in a job</strong> — an artisan sees a homeowner&rsquo;s request
            address and, only after their offer is accepted, contact details. A homeowner sees an
            artisan&rsquo;s public profile, verification status, and ratings — never their raw ID
            documents.
          </li>
          <li>
            <strong>Infrastructure &amp; processors</strong> who process data on our behalf under
            contract, and only for the purpose we specify: our database host, Cloudinary (secure storage
            for photos and verification documents), Mapbox (converting addresses to map coordinates for
            matching), Resend (sending transactional emails), and Anthropic (AI-assisted ranking of
            artisan offers — only the job description and anonymised candidate profiles are sent, never
            your ID documents or full account details).
          </li>
          <li>
            <strong>Law enforcement or regulators</strong>, only where required by Nigerian law or a
            valid legal request.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "blockchain",
    heading: "Blockchain records",
    body: (
      <>
        <p>
          VEYRO anchors certain trust events — identity verification status, credential approvals, and
          reviews — on the Polygon blockchain to make them tamper-evident. Only a cryptographic hash and
          a status flag are written on-chain — never your name, ID document, address, or any other raw
          personal data. The blockchain record cannot be used on its own to identify you.
        </p>
        <p>
          Because blockchain records are permanent by design, they are the one exception to the right to
          erasure described below: we can delete your personal data from our systems, but an on-chain
          hash (which is not personal data on its own) cannot be removed after the fact.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep your data",
    body: (
      <p>
        We retain your personal data for as long as your account is active. If you delete your account,
        we remove your personal data within a reasonable period, except where we are required to retain
        limited records (e.g. dispute history, fraud prevention, or legal compliance) for longer, as
        permitted under the NDPR.
      </p>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights under the NDPR",
    body: (
      <>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Correct</strong> inaccurate or incomplete data.</li>
          <li><strong>Erase</strong> your personal data, subject to the blockchain limitation above and any legal retention requirements.</li>
          <li><strong>Restrict or object</strong> to certain processing of your data.</li>
          <li><strong>Withdraw consent</strong> at any time.</li>
          <li><strong>Data portability</strong> — request a copy of your data in a structured, commonly used format.</li>
          <li>
            <strong>Lodge a complaint</strong> with the Nigeria Data Protection Commission (NDPC) if you
            believe your data has been mishandled.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:support@veyro.app">support@veyro.app</a>. We will respond within the timeframe
          required by the NDPR.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "How we protect your data",
    body: (
      <ul>
        <li>Passwords are hashed and never stored or transmitted in plain text.</li>
        <li>All data in transit is encrypted (HTTPS/TLS).</li>
        <li>Verification documents are stored in access-controlled cloud storage and are never shown to other users — only your verification status is public.</li>
        <li>Access to personal data within VEYRO is limited to what is needed for a given role (e.g. only admins reviewing verifications can see ID documents).</li>
      </ul>
    ),
  },
  {
    id: "children",
    heading: "Children's privacy",
    body: (
      <p>
        VEYRO is not intended for use by anyone under 18. We do not knowingly collect personal data from
        minors. If you believe a minor has provided us with personal data, contact us and we will remove
        it.
      </p>
    ),
  },
  {
    id: "transfers",
    heading: "International data transfers",
    body: (
      <p>
        Some of our infrastructure providers (database hosting, cloud storage, email delivery, and AI
        processing) may process data outside Nigeria. Where this happens, we rely on providers that
        maintain adequate data protection safeguards, consistent with NDPR requirements for cross-border
        transfer of personal data.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we will notify
        you by email or through the platform before the changes take effect. The &ldquo;Effective&rdquo;
        date at the top of this page always reflects the latest version.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        For any questions about this Privacy Policy or how your data is handled, contact us at{" "}
        <a href="mailto:support@veyro.app">support@veyro.app</a>.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate="1 August 2026"
      intro="This policy explains how VEYRO collects, uses, stores, and protects your personal data, and the rights you have over it under the Nigeria Data Protection Regulation (NDPR)."
      sections={SECTIONS}
    />
  );
}
