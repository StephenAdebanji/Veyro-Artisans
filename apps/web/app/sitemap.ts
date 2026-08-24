import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL ?? "https://veyro-artisans-web.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/for-homeowners`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/for-artisans`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/trust`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
