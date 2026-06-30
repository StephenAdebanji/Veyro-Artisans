import type { ExperienceLevel as DbExperienceLevel } from "@prisma/client";
import type { ExperienceLevel as ContractExperienceLevel } from "@veyro/contracts";

/** Prisma enum identifiers can't be "0-2" etc., so this is the one explicit
 * translation point between the DB representation and the contract DTO. */
export const EXPERIENCE_TO_DB: Record<ContractExperienceLevel, DbExperienceLevel> = {
  "0-2": "ZERO_TO_TWO",
  "3-5": "THREE_TO_FIVE",
  "6-10": "SIX_TO_TEN",
  "10+": "TEN_PLUS",
};

export const EXPERIENCE_FROM_DB: Record<DbExperienceLevel, ContractExperienceLevel> = {
  ZERO_TO_TWO: "0-2",
  THREE_TO_FIVE: "3-5",
  SIX_TO_TEN: "6-10",
  TEN_PLUS: "10+",
};
