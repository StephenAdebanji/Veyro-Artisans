import type { SkillCategory } from "@veyro/contracts";

export const SKILL_LABELS: Record<SkillCategory, string> = {
  ELECTRICIAN: "Electrician",
  PLUMBER: "Plumber",
  CARPENTER: "Carpenter",
  PAINTER: "Painter",
  WELDER: "Welder",
  SOLAR_TECHNICIAN: "Solar Technician",
  CCTV_INSTALLER: "CCTV Installer",
  INTERIOR_DECORATOR: "Interior Decorator",
};

export const SKILL_CATEGORIES = Object.keys(SKILL_LABELS) as SkillCategory[];

export const EXPERIENCE_LABELS: Record<string, string> = {
  "0-2": "0-2 yrs",
  "3-5": "3-5 yrs",
  "6-10": "6-10 yrs",
  "10+": "10+ yrs",
};
