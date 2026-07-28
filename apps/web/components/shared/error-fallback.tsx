"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function SectionErrorFallback({
  error,
  onRetry,
}: {
  error: Error & { digest?: string };
  onRetry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">This page couldn&apos;t load</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Something went wrong loading this section. Please try again.
      </p>
      <Button onClick={onRetry}>Try again</Button>
    </main>
  );
}
