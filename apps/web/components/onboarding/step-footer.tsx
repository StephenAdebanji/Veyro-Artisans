import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StepFooter({
  step,
  loading,
  continueLabel = "Continue",
}: {
  step: number;
  loading?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="mt-6 flex justify-between">
      {step > 1 ? (
        <Button type="button" variant="outline" asChild>
          <Link href={`/join-artisan/steps/${step - 1}`}>Back</Link>
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : continueLabel}
      </Button>
    </div>
  );
}
