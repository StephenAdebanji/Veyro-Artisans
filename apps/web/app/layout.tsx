import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import TopLoader from "nextjs-toploader";

const siteUrl = process.env.NEXTAUTH_URL ?? "https://veyro-artisans-web.vercel.app";
const defaultDescription =
  "VEYRO matches homeowners with verified, trusted artisans in real time, with AI-driven recommendations and blockchain-backed trust records.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VEYRO — Connecting Homes with Trusted Hands",
    template: "%s | VEYRO",
  },
  description: defaultDescription,
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "VEYRO",
    title: "VEYRO — Connecting Homes with Trusted Hands",
    description: defaultDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "VEYRO — Connecting Homes with Trusted Hands" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VEYRO — Connecting Homes with Trusted Hands",
    description: defaultDescription,
    images: ["/og.png"],
  },
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
