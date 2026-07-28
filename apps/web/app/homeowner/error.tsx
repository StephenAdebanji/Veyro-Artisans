"use client";

import { SectionErrorFallback } from "@/components/shared/error-fallback";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <SectionErrorFallback error={error} onRetry={unstable_retry} />;
}
