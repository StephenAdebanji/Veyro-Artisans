import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardShell } from "@/components/onboarding/wizard-shell";

export default function ApplicationSubmittedPage() {
  return (
    <WizardShell step={8}>
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h2 className="text-xl font-bold">Application submitted</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Our trust team will review your documents within 24 hours.
        </p>
        <Button asChild className="mt-2">
          <Link href="/artisan/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </WizardShell>
  );
}
