"use client";

import "./globals.css";
import { Providers } from "./providers";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  console.error(error);

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full flex-col">
        <Providers>
          <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              We hit an unexpected error. Please try again — if the problem continues, contact support.
            </p>
            <Button onClick={() => unstable_retry()}>Try again</Button>
          </main>
        </Providers>
      </body>
    </html>
  );
}
