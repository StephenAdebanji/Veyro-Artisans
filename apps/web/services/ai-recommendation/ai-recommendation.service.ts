import type {
  AIRecommendationServicePort,
  RankedArtisan,
  RecommendationInput,
} from "@veyro/contracts";
import { prisma } from "@/platform/prisma";
import { isEligible } from "./eligibility";
import { scoreCandidate } from "./scoring";
import { scoreAllCandidates } from "./semantic";

class AIRecommendationService implements AIRecommendationServicePort {
  async rank(input: RecommendationInput): Promise<RankedArtisan[]> {
    const eligible = input.candidates.filter((candidate) =>
      isEligible(candidate, { category: input.category, location: input.location }),
    );

    const weightedResults = eligible.map((candidate) => {
      const { score, breakdown } = scoreCandidate(candidate, input.category, input.location);
      return { candidate, score, breakdown };
    });

    // Blend with Claude semantic scoring when description + bios are provided.
    if (input.description && input.artisanBios) {
      const semanticInputs = eligible.map((c) => ({
        artisanId: c.artisanId,
        skill: c.primarySkill,
        bio: input.artisanBios![c.artisanId] ?? "",
      }));

      const semantic = await scoreAllCandidates(input.description, semanticInputs);

      const ranked: RankedArtisan[] = weightedResults.map(({ candidate, score, breakdown }) => {
        const s = semantic[candidate.artisanId];
        // Final score: 60% formula + 40% Claude semantic relevance
        const blended = s ? score * 0.6 + s.score * 0.4 : score;
        return {
          artisanId: candidate.artisanId,
          artisanName: input.artisanNames?.[candidate.artisanId],
          score: blended,
          breakdown,
          semanticScore: s ? Math.round(s.score * 100) : undefined,
          semanticReason: s?.reason,
        };
      });

      const sorted = ranked.sort((a, b) => b.score - a.score);

      // Persist to RecommendationLog for reproducibility / thesis evaluation.
      prisma.recommendationLog.create({
        data: {
          serviceRequestId: input.serviceRequestId,
          category: input.category,
          candidateCount: eligible.length,
          input: {
            description: input.description,
            location: input.location as unknown as import("@prisma/client").Prisma.InputJsonValue,
            category: input.category,
          } as import("@prisma/client").Prisma.InputJsonValue,
          output: sorted as unknown as import("@prisma/client").Prisma.InputJsonValue,
        },
      }).catch(() => {}); // non-critical

      return sorted;
    }

    // Fallback: weighted-only (no description provided).
    return weightedResults
      .sort((a, b) => b.score - a.score)
      .map(({ candidate, score, breakdown }) => ({
        artisanId: candidate.artisanId,
        score,
        breakdown,
      }));
  }
}

export const aiRecommendationService = new AIRecommendationService();
