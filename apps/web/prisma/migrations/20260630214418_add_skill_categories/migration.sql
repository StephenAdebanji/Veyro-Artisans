-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "user"."SkillCategory" ADD VALUE 'AC_TECHNICIAN';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'GENERATOR_TECHNICIAN';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'AUTO_MECHANIC';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'POP_INSTALLER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'TILER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'FURNITURE_MAKER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'CLEANER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'PHONE_REPAIR_TECHNICIAN';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'COMPUTER_TECHNICIAN';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'REFRIGERATOR_TECHNICIAN';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'BOREHOLE_TECHNICIAN';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'ALUMINIUM_FABRICATOR';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'BRICKLAYER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'MASON';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'ROOFER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'CEILING_INSTALLER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'UPHOLSTERER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'BARBER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'HAIR_STYLIST';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'MAKEUP_ARTIST';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'TAILOR';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'LAUNDRY_SERVICE_PROVIDER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'PHOTOGRAPHER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'VIDEOGRAPHER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'EVENT_DECORATOR';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'CATERER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'BAKER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'PEST_CONTROL_SPECIALIST';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'LOCKSMITH';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'VULCANIZER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'PANEL_BEATER';
ALTER TYPE "user"."SkillCategory" ADD VALUE 'GATE_AUTOMATION_TECHNICIAN';
