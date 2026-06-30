-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ai";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "blockchain";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "chat";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "matching";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notification";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "trust";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user";

-- CreateEnum
CREATE TYPE "auth"."Role" AS ENUM ('HOMEOWNER', 'ARTISAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "user"."SkillCategory" AS ENUM ('ELECTRICIAN', 'PLUMBER', 'CARPENTER', 'PAINTER', 'WELDER', 'SOLAR_TECHNICIAN', 'CCTV_INSTALLER', 'INTERIOR_DECORATOR');

-- CreateEnum
CREATE TYPE "user"."ExperienceLevel" AS ENUM ('ZERO_TO_TWO', 'THREE_TO_FIVE', 'SIX_TO_TEN', 'TEN_PLUS');

-- CreateEnum
CREATE TYPE "user"."ArtisanOnboardingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "user"."ArtisanVerificationStatusCache" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "matching"."ServiceRequestStatus" AS ENUM ('SEARCHING', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "matching"."MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "matching"."JobStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "matching"."DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "trust"."CredentialType" AS ENUM ('NIN', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'PASSPORT', 'UTILITY_BILL', 'BANK_STATEMENT', 'TRADE_CERTIFICATE', 'LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "trust"."CredentialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "trust"."VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "trust"."TrustScoreSource" AS ENUM ('SYSTEM_RECALC', 'ADMIN_OVERRIDE');

-- CreateEnum
CREATE TYPE "chat"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'LOCATION');

-- CreateEnum
CREATE TYPE "notification"."NotificationType" AS ENUM ('MATCH_OFFERED', 'MATCH_ACCEPTED', 'JOB_COMPLETED', 'CREDENTIAL_APPROVED', 'CREDENTIAL_REJECTED', 'TRUST_SCORE_UPDATED', 'MESSAGE_RECEIVED', 'DISPUTE_RAISED', 'DISPUTE_RESOLVED');

-- CreateEnum
CREATE TYPE "blockchain"."BlockchainRecordType" AS ENUM ('IDENTITY_VERIFIED', 'CREDENTIAL_VERIFIED', 'TRUST_SCORE_UPDATE', 'REVIEW_HASH', 'DISPUTE_RESOLUTION');

-- CreateEnum
CREATE TYPE "blockchain"."BlockchainRecordStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "blockchain"."BlockchainNetwork" AS ENUM ('HARDHAT_LOCAL', 'POLYGON_AMOY');

-- CreateTable
CREATE TABLE "auth"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "auth"."Role" NOT NULL,
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user"."HomeownerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeownerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user"."ArtisanProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "profilePhotoUrl" TEXT,
    "primarySkill" "user"."SkillCategory",
    "secondarySkills" TEXT[],
    "experienceLevel" "user"."ExperienceLevel",
    "bio" TEXT,
    "serviceRadiusKm" INTEGER NOT NULL DEFAULT 10,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "lga" TEXT,
    "residentialAddress" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "onboardingStatus" "user"."ArtisanOnboardingStatus" NOT NULL DEFAULT 'DRAFT',
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "verificationStatus" "user"."ArtisanVerificationStatusCache" NOT NULL DEFAULT 'UNVERIFIED',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "responseTimeAvgSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtisanProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user"."ArtisanAvailability" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "workingDays" TEXT[],
    "startTime" TEXT,
    "endTime" TEXT,
    "emergencyAvailable" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtisanAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user"."PortfolioItem" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "beforeUrl" TEXT,
    "afterUrl" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching"."ServiceRequest" (
    "id" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "category" "user"."SkillCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "preferredDate" TIMESTAMP(3),
    "status" "matching"."ServiceRequestStatus" NOT NULL DEFAULT 'SEARCHING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching"."Match" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "proposedPrice" INTEGER NOT NULL,
    "etaMinutes" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "status" "matching"."MatchStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching"."Job" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "agreedPrice" INTEGER NOT NULL,
    "status" "matching"."JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching"."Review" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "verificationHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching"."Dispute" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "matching"."DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust"."Credential" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "type" "trust"."CredentialType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "trust"."CredentialStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "onChainTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust"."TrustProfile" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "verificationStatus" "trust"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "totalJobsAccepted" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "responseTimeAvgSeconds" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust"."TrustScoreHistory" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "source" "trust"."TrustScoreSource" NOT NULL,
    "onChainTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."Conversation" (
    "id" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "jobId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" "chat"."MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT,
    "mediaUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "notification"."NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain"."BlockchainRecord" (
    "id" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "type" "blockchain"."BlockchainRecordType" NOT NULL,
    "status" "blockchain"."BlockchainRecordStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "contractAddress" TEXT,
    "network" "blockchain"."BlockchainNetwork",
    "payload" JSONB NOT NULL,
    "blockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "BlockchainRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."RecommendationLog" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "category" "user"."SkillCategory" NOT NULL,
    "candidateCount" INTEGER NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "auth"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "auth"."User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "HomeownerProfile_userId_key" ON "user"."HomeownerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtisanProfile_userId_key" ON "user"."ArtisanProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtisanAvailability_artisanId_key" ON "user"."ArtisanAvailability"("artisanId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_serviceRequestId_key" ON "matching"."Job"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_matchId_key" ON "matching"."Job"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_jobId_key" ON "matching"."Review"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustProfile_artisanId_key" ON "trust"."TrustProfile"("artisanId");

-- CreateIndex
CREATE INDEX "BlockchainRecord_refId_idx" ON "blockchain"."BlockchainRecord"("refId");

-- AddForeignKey
ALTER TABLE "auth"."AdminActionLog" ADD CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."HomeownerProfile" ADD CONSTRAINT "HomeownerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."ArtisanProfile" ADD CONSTRAINT "ArtisanProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."ArtisanAvailability" ADD CONSTRAINT "ArtisanAvailability_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "user"."ArtisanProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."PortfolioItem" ADD CONSTRAINT "PortfolioItem_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "user"."ArtisanProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching"."Match" ADD CONSTRAINT "Match_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "matching"."ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching"."Job" ADD CONSTRAINT "Job_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "matching"."ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching"."Review" ADD CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "matching"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching"."Dispute" ADD CONSTRAINT "Dispute_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "matching"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust"."TrustScoreHistory" ADD CONSTRAINT "TrustScoreHistory_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "trust"."TrustProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
