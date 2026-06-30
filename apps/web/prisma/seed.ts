/**
 * Standalone seed script — deliberately does NOT import from "@/platform" or
 * "@/services" (those path aliases only resolve inside Next.js's bundler).
 * It writes directly via its own PrismaClient, which also means none of the
 * domain events (UserRegistered, TrustScoreUpdated, …) fire for this data —
 * that's fine for seeding a demo dataset, but it's why both the `user` schema
 * cache fields AND the `trust` schema's authoritative TrustProfile are set
 * here explicitly, rather than relying on the event sync that the real app
 * flow uses.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Password123!";

interface ArtisanSeed {
  email: string;
  firstName: string;
  lastName: string;
  primarySkill: "ELECTRICIAN" | "PLUMBER" | "CARPENTER" | "PAINTER" | "WELDER" | "SOLAR_TECHNICIAN" | "CCTV_INSTALLER" | "INTERIOR_DECORATOR";
  experienceLevel: "ZERO_TO_TWO" | "THREE_TO_FIVE" | "SIX_TO_TEN" | "TEN_PLUS";
  bio: string;
  city: string;
  state: string;
  gpsLat: number;
  gpsLng: number;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  trustScore: number;
  responseTimeAvgSeconds: number;
}

const ARTISANS: ArtisanSeed[] = [
  {
    email: "emeka@veyro.test",
    firstName: "Emeka",
    lastName: "Okafor",
    primarySkill: "ELECTRICIAN",
    experienceLevel: "SIX_TO_TEN",
    bio: "9 years wiring homes and small businesses across Lagos. Fast, clean, code-compliant work.",
    city: "Lekki",
    state: "Lagos",
    gpsLat: 6.4698,
    gpsLng: 3.5852,
    ratingAvg: 4.9,
    ratingCount: 238,
    completedJobs: 238,
    trustScore: 96,
    responseTimeAvgSeconds: 120,
  },
  {
    email: "aisha@veyro.test",
    firstName: "Aisha",
    lastName: "Bello",
    primarySkill: "INTERIOR_DECORATOR",
    experienceLevel: "SIX_TO_TEN",
    bio: "Modern minimalist interiors. Trusted by 80+ homeowners across Lagos.",
    city: "Ikeja",
    state: "Lagos",
    gpsLat: 6.6018,
    gpsLng: 3.3515,
    ratingAvg: 4.8,
    ratingCount: 154,
    completedJobs: 154,
    trustScore: 92,
    responseTimeAvgSeconds: 1320,
  },
  {
    email: "tunde@veyro.test",
    firstName: "Tunde",
    lastName: "Adeyemi",
    primarySkill: "PLUMBER",
    experienceLevel: "TEN_PLUS",
    bio: "11 years solving leaks, blockages and full bathroom installs.",
    city: "Yaba",
    state: "Lagos",
    gpsLat: 6.5095,
    gpsLng: 3.3711,
    ratingAvg: 4.7,
    ratingCount: 312,
    completedJobs: 312,
    trustScore: 89,
    responseTimeAvgSeconds: 540,
  },
  {
    email: "chiamaka@veyro.test",
    firstName: "Chiamaka",
    lastName: "Eze",
    primarySkill: "CARPENTER",
    experienceLevel: "SIX_TO_TEN",
    bio: "Custom furniture and fittings, built to last.",
    city: "Surulere",
    state: "Lagos",
    gpsLat: 6.5059,
    gpsLng: 3.3548,
    ratingAvg: 4.9,
    ratingCount: 97,
    completedJobs: 97,
    trustScore: 94,
    responseTimeAvgSeconds: 900,
  },
  {
    email: "yusuf@veyro.test",
    firstName: "Yusuf",
    lastName: "Garba",
    primarySkill: "SOLAR_TECHNICIAN",
    experienceLevel: "THREE_TO_FIVE",
    bio: "Solar installs and inverter setups for homes tired of NEPA.",
    city: "Victoria Island",
    state: "Lagos",
    gpsLat: 6.4281,
    gpsLng: 3.4219,
    ratingAvg: 4.6,
    ratingCount: 71,
    completedJobs: 71,
    trustScore: 88,
    responseTimeAvgSeconds: 1500,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@veyro.test" },
    update: {},
    create: { email: "admin@veyro.test", passwordHash, role: "ADMIN" },
  });

  const homeownerUser = await prisma.user.upsert({
    where: { email: "folake@veyro.test" },
    update: {},
    create: { email: "folake@veyro.test", passwordHash, role: "HOMEOWNER" },
  });
  const homeowner = await prisma.homeownerProfile.upsert({
    where: { userId: homeownerUser.id },
    update: {},
    create: { userId: homeownerUser.id, fullName: "Folake Adebayo" },
  });

  const artisanProfiles: Record<string, { id: string }> = {};

  for (const seed of ARTISANS) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: { email: seed.email, passwordHash, role: "ARTISAN" },
    });

    const profile = await prisma.artisanProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        firstName: seed.firstName,
        lastName: seed.lastName,
        primarySkill: seed.primarySkill,
        experienceLevel: seed.experienceLevel,
        bio: seed.bio,
        serviceRadiusKm: 15,
        country: "Nigeria",
        state: seed.state,
        city: seed.city,
        gpsLat: seed.gpsLat,
        gpsLng: seed.gpsLng,
        onboardingStatus: "ACTIVE",
        onboardingStep: 8,
        verificationStatus: "VERIFIED",
        trustScore: seed.trustScore,
        ratingAvg: seed.ratingAvg,
        ratingCount: seed.ratingCount,
        completedJobs: seed.completedJobs,
        responseTimeAvgSeconds: seed.responseTimeAvgSeconds,
      },
    });

    await prisma.artisanAvailability.upsert({
      where: { artisanId: profile.id },
      update: {},
      create: {
        artisanId: profile.id,
        workingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
        startTime: "08:00",
        endTime: "18:00",
        emergencyAvailable: seed.email === "emeka@veyro.test",
      },
    });

    await prisma.trustProfile.upsert({
      where: { artisanId: profile.id },
      update: {},
      create: {
        artisanId: profile.id,
        verificationStatus: "VERIFIED",
        trustScore: seed.trustScore,
        ratingAvg: seed.ratingAvg,
        ratingCount: seed.ratingCount,
        totalJobsAccepted: seed.completedJobs,
        completedJobs: seed.completedJobs,
        responseTimeAvgSeconds: seed.responseTimeAvgSeconds,
      },
    });

    for (const type of ["NIN", "TRADE_CERTIFICATE"] as const) {
      await prisma.credential.create({
        data: {
          artisanId: profile.id,
          type,
          fileUrl: `https://example.com/seed/${seed.email}/${type.toLowerCase()}.pdf`,
          status: "APPROVED",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      });
    }

    artisanProfiles[seed.email] = { id: profile.id };
  }

  // Active request: matched with Emeka, artisan en route — mirrors the
  // "Kitchen power tripping" card on the homeowner dashboard mockup.
  const activeRequest = await prisma.serviceRequest.create({
    data: {
      homeownerId: homeowner.id,
      category: "ELECTRICIAN",
      description: "Kitchen power tripping",
      lat: 6.45,
      lng: 3.47,
      address: "12 Admiralty Way, Lekki Phase 1, Lagos",
      status: "IN_PROGRESS",
    },
  });
  const activeMatch = await prisma.match.create({
    data: {
      serviceRequestId: activeRequest.id,
      artisanId: artisanProfiles["emeka@veyro.test"].id,
      proposedPrice: 18000,
      etaMinutes: 10,
      distanceKm: 1.2,
      status: "ACCEPTED",
      respondedAt: new Date(),
    },
  });
  await prisma.job.create({
    data: {
      serviceRequestId: activeRequest.id,
      matchId: activeMatch.id,
      artisanId: artisanProfiles["emeka@veyro.test"].id,
      homeownerId: homeowner.id,
      agreedPrice: 18000,
      status: "ACTIVE",
    },
  });

  // Second active request: still searching, no match yet — mirrors the
  // "Master bedroom paint refresh" / "Awaiting matches" card on the mockup.
  await prisma.serviceRequest.create({
    data: {
      homeownerId: homeowner.id,
      category: "PAINTER",
      description: "Master bedroom paint refresh",
      lat: 6.45,
      lng: 3.47,
      address: "12 Admiralty Way, Lekki Phase 1, Lagos",
      status: "SEARCHING",
    },
  });

  // A completed past job + review for Aisha Bello, so her public profile's
  // Reviews section isn't empty.
  const pastRequest = await prisma.serviceRequest.create({
    data: {
      homeownerId: homeowner.id,
      category: "INTERIOR_DECORATOR",
      description: "Living room interior refresh",
      lat: 6.6,
      lng: 3.35,
      address: "12 Admiralty Way, Lekki Phase 1, Lagos",
      status: "COMPLETED",
    },
  });
  const pastMatch = await prisma.match.create({
    data: {
      serviceRequestId: pastRequest.id,
      artisanId: artisanProfiles["aisha@veyro.test"].id,
      proposedPrice: 25000,
      etaMinutes: 22,
      distanceKm: 2.4,
      status: "ACCEPTED",
      respondedAt: new Date(),
    },
  });
  const pastJob = await prisma.job.create({
    data: {
      serviceRequestId: pastRequest.id,
      matchId: pastMatch.id,
      artisanId: artisanProfiles["aisha@veyro.test"].id,
      homeownerId: homeowner.id,
      agreedPrice: 25000,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
  const reviewComment = "Aisha transformed our living room beautifully — professional and on time.";
  await prisma.review.create({
    data: {
      jobId: pastJob.id,
      homeownerId: homeowner.id,
      artisanId: artisanProfiles["aisha@veyro.test"].id,
      rating: 5,
      comment: reviewComment,
      verificationHash: createHash("sha256")
        .update(`${pastJob.id}:${artisanProfiles["aisha@veyro.test"].id}:5:${reviewComment}:${randomUUID()}`)
        .digest("hex"),
    },
  });

  console.log("\nSeed complete. Every seeded account's password is:", SEED_PASSWORD);
  console.log("Homeowner: folake@veyro.test");
  console.log("Admin:     admin@veyro.test");
  console.log("Artisans: ", ARTISANS.map((a) => a.email).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
