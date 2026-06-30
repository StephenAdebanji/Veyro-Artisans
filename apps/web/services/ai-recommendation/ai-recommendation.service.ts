import type {
  AIRecommendationServicePort,
  RankedArtisan,
  RecommendationInput,
} from "@veyro/contracts";
import { isEligible } from "./eligibility";
import { scoreCandidate } from "./scoring";

/**
 * Stateless ranking over caller-supplied inputs (Matching Service gathers
 * eligible-shaped candidates from User Service, then calls `rank`). No
 * persistent domain data of its own beyond the optional RecommendationLog,
 * which the caller writes for evaluation/reproducibility — this service never
 * touches Prisma directly.
 */
class AIRecommendationService implements AIRecommendationServicePort {
  async rank(input: RecommendationInput): Promise<RankedArtisan[]> {
    const eligible = input.candidates.filter((candidate) =>
      isEligible(candidate, { category: input.category, location: input.location }),
    );

    const ranked = eligible.map((candidate) => {
      const { score, breakdown } = scoreCandidate(candidate, input.category, input.location);
      return { artisanId: candidate.artisanId, score, breakdown };
    });

    return ranked.sort((a, b) => b.score - a.score);
  }
}

export const aiRecommendationService = new AIRecommendationService();
