import { anthropic } from "@/platform/claude";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";

export interface SemanticResult {
  score: number; // 0-1
  reason: string;
}

export async function getSemanticScore(
  jobDescription: string,
  artisanSkill: SkillCategory,
  artisanBio: string,
): Promise<SemanticResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { score: 0.5, reason: "Matched by skill category" };
  }

  const skillLabel = SKILL_LABELS[artisanSkill] ?? artisanSkill;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: `Rate how well this artisan matches a homeowner's job request. Respond with JSON only.

Job: "${jobDescription}"
Artisan trade: ${skillLabel}
Artisan bio: "${artisanBio || "No bio provided"}"

JSON format: {"score": <0-100>, "reason": "<one short sentence, max 12 words>"}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const parsed = JSON.parse(text) as { score: number; reason: string };

    return {
      score: Math.max(0, Math.min(100, parsed.score)) / 100,
      reason: parsed.reason ?? "Good skill match for this job",
    };
  } catch {
    return { score: 0.5, reason: "Matched by skill category" };
  }
}

const SEMANTIC_TIMEOUT_MS = 8000;
const BATCH_SIZE = 10;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function scoreAllCandidates(
  jobDescription: string,
  candidates: Array<{ artisanId: string; skill: SkillCategory; bio: string }>,
): Promise<Record<string, SemanticResult>> {
  const fallback: SemanticResult = { score: 0.5, reason: "Matched by skill category" };
  const out: Record<string, SemanticResult> = {};

  // Process in batches to avoid hammering the API with hundreds of parallel calls.
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (c) => {
        const result = await withTimeout(
          getSemanticScore(jobDescription, c.skill, c.bio),
          SEMANTIC_TIMEOUT_MS,
          fallback,
        );
        return [c.artisanId, result] as [string, SemanticResult];
      }),
    );
    for (const [id, result] of results) out[id] = result;
  }

  return out;
}
