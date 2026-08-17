"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // refetchOnWindowFocus is off deliberately: its default refetch would
    // silently extend the 30-minute idle session just from alt-tabbing back,
    // with no real activity — see components/shared/idle-session-guard.tsx,
    // which is the only thing meant to decide when a session gets extended.
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
