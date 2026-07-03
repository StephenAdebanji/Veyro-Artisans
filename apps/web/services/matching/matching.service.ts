import { createHash, randomUUID } from "node:crypto";
import type { SkillCategory as DbSkillCategory } from "@prisma/client";
import type {
  ActiveRequestSummary,
  AvailableRequestSummary,
  CompletedJobSummary,
  CreateServiceRequestInput,
  GeoPoint,
  JobFeedItem,
  JobHistoryItem,
  MatchDecision,
  MatchOfferInput,
  MatchingServicePort,
  MatchOfferSummary,
  ReviewSummary,
  ServiceRequestStatus,
  ServiceRequestSummary,
  SkillCategory,
} from "@veyro/contracts";
import { eventBus } from "@/platform/event-bus";
import { haversineKm } from "@/platform/geo";
import { matchingRepository } from "./matching.repository";

/** Owns: ServiceRequest, Match, Job, Review, Dispute — the job lifecycle end to
 * end. Never reads User/Trust schemas directly; the API gateway route is
 * responsible for gathering candidate data (User Service) and ranking
 * (AI Recommendation Service) before calling `offerMatch` per responding
 * artisan. */
class MatchingService implements MatchingServicePort {
  async createServiceRequest(input: CreateServiceRequestInput): Promise<string> {
    const request = await matchingRepository.createServiceRequest({
      homeownerId: input.homeownerId,
      category: input.category as DbSkillCategory,
      description: input.description,
      lat: input.location.lat,
      lng: input.location.lng,
      address: input.address,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
    });

    eventBus.publish({
      type: "ServiceRequestCreated",
      serviceRequestId: request.id,
      homeownerId: input.homeownerId,
      category: input.category,
      location: input.location,
      occurredAt: new Date().toISOString(),
    });

    return request.id;
  }

  async getServiceRequestStatus(serviceRequestId: string): Promise<ServiceRequestStatus> {
    const request = await matchingRepository.findServiceRequest(serviceRequestId);
    if (!request) throw new Error("Service request not found");
    return request.status;
  }

  async getServiceRequest(serviceRequestId: string): Promise<ServiceRequestSummary | null> {
    const request = await matchingRepository.findServiceRequest(serviceRequestId);
    if (!request) return null;

    return {
      id: request.id,
      homeownerId: request.homeownerId,
      category: request.category,
      description: request.description,
      address: request.address,
      location: { lat: request.lat, lng: request.lng },
      status: request.status,
      budgetMin: request.budgetMin,
      budgetMax: request.budgetMax,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async offerMatch(input: MatchOfferInput): Promise<string> {
    const match = await matchingRepository.createMatch(input);
    await matchingRepository.updateServiceRequestStatus(input.serviceRequestId, "MATCHED");

    eventBus.publish({
      type: "MatchOffered",
      matchId: match.id,
      serviceRequestId: input.serviceRequestId,
      artisanId: input.artisanId,
      occurredAt: new Date().toISOString(),
    });

    return match.id;
  }

  async listOffers(serviceRequestId: string): Promise<MatchOfferSummary[]> {
    const matches = await matchingRepository.listMatchesForRequest(serviceRequestId);
    return matches.map((match) => ({
      id: match.id,
      artisanId: match.artisanId,
      proposedPrice: match.proposedPrice,
      etaMinutes: match.etaMinutes,
      distanceKm: match.distanceKm,
      status: match.status,
    }));
  }

  async respondToOffer(
    matchId: string,
    decision: MatchDecision,
  ): Promise<{ jobId: string | null }> {
    const match = await matchingRepository.findMatch(matchId);
    if (!match) throw new Error("Match not found");

    if (decision === "DECLINE") {
      await matchingRepository.updateMatchStatus(matchId, "DECLINED");
      return { jobId: null };
    }

    const request = await matchingRepository.findServiceRequest(match.serviceRequestId);
    if (!request) throw new Error("Service request not found");

    await matchingRepository.updateMatchStatus(matchId, "ACCEPTED");
    await matchingRepository.expirePendingMatches(match.serviceRequestId, matchId);
    await matchingRepository.updateServiceRequestStatus(match.serviceRequestId, "IN_PROGRESS");

    const job = await matchingRepository.createJob({
      serviceRequestId: match.serviceRequestId,
      matchId,
      artisanId: match.artisanId,
      homeownerId: request.homeownerId,
      agreedPrice: match.proposedPrice,
    });

    eventBus.publish({
      type: "MatchAccepted",
      matchId,
      serviceRequestId: match.serviceRequestId,
      artisanId: match.artisanId,
      homeownerId: request.homeownerId,
      jobId: job.id,
      occurredAt: new Date().toISOString(),
    });

    return { jobId: job.id };
  }

  async updateJobStatus(jobId: string, artisanId: string, status: "IN_PROGRESS" | "COMPLETED"): Promise<void> {
    const job = await matchingRepository.findJob(jobId);
    if (!job || job.artisanId !== artisanId) throw new Error("Job not found");
    if (job.status === "COMPLETED") throw new Error("Job is already completed");

    if (status === "COMPLETED") {
      await this.completeJob(jobId);
    } else {
      await matchingRepository.updateJobStatus(jobId, "IN_PROGRESS");
    }
  }

  async completeJob(jobId: string): Promise<void> {
    const job = await matchingRepository.completeJob(jobId);
    await matchingRepository.updateServiceRequestStatus(job.serviceRequestId, "COMPLETED");

    eventBus.publish({
      type: "JobCompleted",
      jobId: job.id,
      artisanId: job.artisanId,
      homeownerId: job.homeownerId,
      completedAt: (job.completedAt ?? new Date()).toISOString(),
      occurredAt: new Date().toISOString(),
    });
  }

  async submitReview(jobId: string, rating: number, comment?: string): Promise<string> {
    const job = await matchingRepository.findJob(jobId);
    if (!job) throw new Error("Job not found");

    const verificationHash = createHash("sha256")
      .update(`${jobId}:${job.artisanId}:${rating}:${comment ?? ""}:${randomUUID()}`)
      .digest("hex");

    const review = await matchingRepository.createReview({
      jobId,
      homeownerId: job.homeownerId,
      artisanId: job.artisanId,
      rating,
      comment,
      verificationHash,
    });

    eventBus.publish({
      type: "ReviewSubmitted",
      reviewId: review.id,
      jobId,
      artisanId: job.artisanId,
      rating,
      verificationHash,
      occurredAt: new Date().toISOString(),
    });

    return review.id;
  }

  async listActiveRequestsForHomeowner(homeownerId: string): Promise<ActiveRequestSummary[]> {
    const requests = await matchingRepository.listActiveRequestsForHomeowner(homeownerId);
    return requests.map((request) => {
      const accepted = request.matches[0];
      return {
        id: request.id,
        category: request.category,
        description: request.description,
        status: request.status,
        acceptedMatch: accepted
          ? { artisanId: accepted.artisanId, etaMinutes: accepted.etaMinutes }
          : null,
        jobId: request.job?.id ?? null,
      };
    });
  }

  async listCompletedJobsForHomeowner(homeownerId: string): Promise<CompletedJobSummary[]> {
    const jobs = await matchingRepository.listCompletedJobsForHomeowner(homeownerId);
    return jobs.map((job) => ({
      jobId: job.id,
      serviceRequestId: job.serviceRequestId,
      category: job.serviceRequest.category,
      description: job.serviceRequest.description,
      artisanId: job.artisanId,
      agreedPrice: job.agreedPrice,
      completedAt: job.completedAt?.toISOString() ?? null,
      hasReview: job.review !== null,
    }));
  }

  async findJobForHomeowner(jobId: string, homeownerId: string) {
    const job = await matchingRepository.findJobByIdForHomeowner(jobId, homeownerId);
    if (!job) return null;
    return {
      jobId: job.id,
      artisanId: job.artisanId,
      homeownerId: job.homeownerId,
      agreedPrice: job.agreedPrice,
      status: job.status,
      completedAt: job.completedAt?.toISOString() ?? null,
      category: job.serviceRequest.category,
      description: job.serviceRequest.description,
      hasReview: job.review !== null,
      review: job.review ? { rating: job.review.rating, comment: job.review.comment } : null,
    };
  }

  async listReviewsForArtisan(artisanId: string): Promise<ReviewSummary[]> {
    const reviews = await matchingRepository.listReviewsForArtisan(artisanId);
    return reviews.map((review) => ({
      id: review.id,
      homeownerId: review.homeownerId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    }));
  }

  async countCompletedRequestsForHomeowner(homeownerId: string): Promise<number> {
    return matchingRepository.countCompletedRequestsForHomeowner(homeownerId);
  }

  async listAvailableRequests(filter: {
    artisanId: string;
    category: SkillCategory;
    near: GeoPoint;
    radiusKm: number;
  }): Promise<AvailableRequestSummary[]> {
    const requests = await matchingRepository.listSearchingRequests(
      filter.category as DbSkillCategory,
      filter.artisanId,
    );

    return requests
      .map((request) => ({
        id: request.id,
        category: request.category,
        description: request.description,
        address: request.address,
        budgetMin: request.budgetMin,
        budgetMax: request.budgetMax,
        distanceKm: haversineKm(filter.near, { lat: request.lat, lng: request.lng }),
        createdAt: request.createdAt.toISOString(),
      }))
      .filter((request) => request.distanceKm <= filter.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async listJobsFeedForArtisan(artisanId: string): Promise<JobFeedItem[]> {
    const [pendingMatches, jobs] = await Promise.all([
      matchingRepository.listPendingMatchesForArtisan(artisanId),
      matchingRepository.listJobsForArtisan(artisanId),
    ]);

    const pendingItems: JobFeedItem[] = pendingMatches.map((match) => ({
      id: match.id,
      category: match.serviceRequest.category,
      description: match.serviceRequest.description,
      homeownerId: match.serviceRequest.homeownerId,
      status: "PENDING",
      price: match.proposedPrice,
    }));

    const jobItems: JobFeedItem[] = jobs.map((job) => ({
      id: job.id,
      category: job.serviceRequest.category,
      description: job.serviceRequest.description,
      homeownerId: job.homeownerId,
      status: job.status,
      price: job.agreedPrice,
    }));

    return [...pendingItems, ...jobItems];
  }

  async getJobFeedItem(
    jobId: string,
    artisanId: string,
  ): Promise<(JobFeedItem & { conversationId: string | null }) | null> {
    // Check pending matches first (PENDING state)
    const match = await matchingRepository.findPendingMatchForArtisan(jobId, artisanId);
    if (match) {
      return {
        id: match.id,
        category: match.serviceRequest.category,
        description: match.serviceRequest.description,
        homeownerId: match.serviceRequest.homeownerId,
        status: "PENDING",
        price: match.proposedPrice,
        conversationId: null,
      };
    }
    // Otherwise look up a real Job row
    const job = await matchingRepository.findJobForArtisan(jobId, artisanId);
    if (!job) return null;
    const conv = await matchingRepository.findConversationByJob(jobId);
    return {
      id: job.id,
      category: job.serviceRequest.category,
      description: job.serviceRequest.description,
      homeownerId: job.homeownerId,
      status: job.status,
      price: job.agreedPrice,
      conversationId: conv?.id ?? null,
    };
  }

  async countActiveJobsForArtisan(artisanId: string): Promise<number> {
    return matchingRepository.countActiveJobsForArtisan(artisanId);
  }

  async countDisputesForArtisan(artisanId: string): Promise<number> {
    return matchingRepository.countDisputesForArtisan(artisanId);
  }

  private toHistoryItem(job: {
    id: string; serviceRequestId: string; artisanId: string; homeownerId: string;
    agreedPrice: number; status: string; startedAt: Date; inProgressAt?: Date | null;
    completedAt: Date | null;
    serviceRequest: { category: string; description: string; address: string };
  }): JobHistoryItem {
    return {
      jobId: job.id,
      serviceRequestId: job.serviceRequestId,
      category: job.serviceRequest.category as import("@veyro/contracts").SkillCategory,
      description: job.serviceRequest.description,
      address: job.serviceRequest.address,
      artisanId: job.artisanId,
      homeownerId: job.homeownerId,
      agreedPrice: job.agreedPrice,
      status: job.status as import("@veyro/contracts").JobFeedStatus,
      startedAt: job.startedAt.toISOString(),
      inProgressAt: job.inProgressAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  }

  async listJobsHistoryForArtisan(artisanId: string): Promise<JobHistoryItem[]> {
    const jobs = await matchingRepository.listJobsHistoryForArtisan(artisanId);
    return jobs.map((j) => this.toHistoryItem(j));
  }

  async listJobsHistoryForHomeowner(homeownerId: string): Promise<JobHistoryItem[]> {
    const jobs = await matchingRepository.listJobsHistoryForHomeowner(homeownerId);
    return jobs.map((j) => this.toHistoryItem(j));
  }

  async listAllJobsHistory(): Promise<JobHistoryItem[]> {
    const jobs = await matchingRepository.listAllJobsHistory();
    return jobs.map((j) => this.toHistoryItem(j));
  }
}

export const matchingService = new MatchingService();
