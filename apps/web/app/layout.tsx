import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import TopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "VEYRO — Connecting Homes with Trusted Hands",
  description:
    "VEYRO matches homeowners with verified, trusted artisans in real time, with AI-driven recommendations and blockchain-backed trust records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full flex-col">
        <TopLoader color="#1E3A8A" height={3} showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
