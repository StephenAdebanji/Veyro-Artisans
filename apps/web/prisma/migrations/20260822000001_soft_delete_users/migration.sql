-- AlterEnum
ALTER TYPE "auth"."UserStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "auth"."User" ADD COLUMN "deleteReason" TEXT;
