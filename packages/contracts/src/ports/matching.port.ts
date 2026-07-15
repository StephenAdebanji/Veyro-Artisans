import type { GeoPoint, MatchStatus, ServiceRequestStatus, SkillCategory } from "../common";

export interface CreateServiceRequestInput {
  homeownerId: string;
  category: SkillCategory;
  description: string;
  location: GeoPoint;
  address: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredDate?: string;
}

export interface MatchOfferInput {
  serviceRequestId: string;
  artisanId: string;
  proposedPrice: number;
  etaMinutes: number;
  distanceKm: number;
}

export type MatchDecision = "ACCEPT" | "DECLINE";

export interface MatchOfferSummary {
  id: string;
  artisanId: string;
  proposedPrice: number;
  etaMinutes: number;
  distanceKm: number;
  status: MatchStatus;
}

export interface ServiceRequestSummary {
  id: string;
  homeownerId: string;
  category: SkillCategory;
  description: string;
  address: string;
  location: GeoPoint;
  status: ServiceRequestStatus;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
}

export interface ActiveRequestSummary {
  id: string;
  category: SkillCategory;
  description: string;
  status: ServiceRequestStatus;
  acceptedMatch: { artisanId: string; etaMinutes: number } | null;
  jobId: string | null;
}

export interface CompletedJobSummary {
  jobId: string;
  serviceRequestId: string;
  category: SkillCategory;
  description: string;
  artisanId: string;
  agreedPrice: number;
  completedAt: string | null;
  hasReview: boolean;
}

export interface ReviewSummary {
  id: string;
  homeownerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface AvailableRequestSummary {
  id: string;
  category: SkillCategory;
  description: string;
  address: string;
  budgetMin: number | null;
  budgetMax: number | null;
  distanceKm: number;
  createdAt: string;
}

export interface JobHistoryItem {
  jobId: string;
  serviceRequestId: string;
  category: SkillCategory;
  description: string;
  address: string;
  artisanId: string;
  homeownerId: string;
  agreedPrice: number;
  status: JobFeedStatus;
  startedAt: string;
  inProgressAt: string | null;
  completedAt: string | null;
}

export type JobFeedStatus = "PENDING" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED" | "CANCELLED";

export interface JobFeedItem {
  id: string;
  category: SkillCategory;
  description: string;
  homeownerId: string;
  status: JobFeedStatus;
  price: number;
}

/** Owns: ServiceRequest, Match, Job, Review, Dispute — the job lifecycle end-to-end. */
export interface MatchingServicePort {
  createServiceRequest(input: CreateServiceRequestInput): Promise<string>;
  getServiceRequestStatus(serviceRequestId: string): Promise<ServiceRequestStatus>;
  /** Used by the API gateway (e.g. the AI recommendations route) instead of reaching into Matching's Prisma models directly. */
  getServiceRequest(serviceRequestId: string): Promise<ServiceRequestSummary | null>;
  /** An artisan responds to a broadcasted request with a price/ETA offer — this is what renders as a response card on the homeowner's matching screen. */
  offerMatch(input: MatchOfferInput): Promise<string>;
  /** Poll fallback for the matching screen if the Socket.io push is missed. */
  listOffers(serviceRequestId: string): Promise<MatchOfferSummary[]>;
  /** The homeowner accepts or declines one specific offer card. ACCEPT creates the Job and expires every other pending offer for that request; DECLINE only removes this one card. */
  respondToOffer(matchId: string, decision: MatchDecision): Promise<{ jobId: string | null }>;
  updateJobStatus(jobId: string, artisanId: string, status: "IN_PROGRESS" | "COMPLETED"): Promise<void>;
  completeJob(jobId: string): Promise<void>;
  submitReview(jobId: string, rating: number, comment?: string): Promise<string>;
  listCompletedJobsForHomeowner(homeownerId: string): Promise<CompletedJobSummary[]>;
  findJobForHomeowner(jobId: string, homeownerId: string): Promise<{
    jobId: string; artisanId: string; homeownerId: string; agreedPrice: number;
    status: string; completedAt: string | null; category: string; description: string;
    hasReview: boolean; review: { rating: number; comment: string | null } | null;
  } | null>;
  /** Backs the homeowner dashboard's "Active requests" cards. */
  listActiveRequestsForHomeowner(homeownerId: string): Promise<ActiveRequestSummary[]>;
  /** Backs the artisan public profile's "Reviews" section. */
  listReviewsForArtisan(artisanId: string): Promise<ReviewSummary[]>;
  /** Backs the homeowner dashboard's "Completed" stat card. */
  countCompletedRequestsForHomeowner(homeownerId: string): Promise<number>;
  /** Backs the artisan dashboard's "Available jobs" — SEARCHING requests matching category, within radius of `near`, excluding requests this artisan already offered on. Distance is computed here (haversine) rather than by the caller. */
  listAvailableRequests(filter: {
    artisanId: string;
    category: SkillCategory;
    near: GeoPoint | null;
    radiusKm: number;
  }): Promise<AvailableRequestSummary[]>;
  /** Backs the artisan dashboard's "Jobs" table — merges this artisan's PENDING offers with their ACTIVE/COMPLETED jobs into one feed. */
  listJobsFeedForArtisan(artisanId: string): Promise<JobFeedItem[]>;
  /** Backs the artisan dashboard's "Active jobs" stat card. */
  countActiveJobsForArtisan(artisanId: string): Promise<number>;
  /** Backs the artisan dashboard's Reputation panel. */
  countDisputesForArtisan(artisanId: string): Promise<number>;
  cancelServiceRequest(serviceRequestId: string, homeownerId: string): Promise<void>;
  listJobsHistoryForArtisan(artisanId: string): Promise<JobHistoryItem[]>;
  listJobsHistoryForHomeowner(homeownerId: string): Promise<JobHistoryItem[]>;
  listAllJobsHistory(): Promise<JobHistoryItem[]>;
}
