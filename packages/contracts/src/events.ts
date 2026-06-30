import type {
  BlockchainNetwork,
  BlockchainRecordType,
  CredentialType,
  GeoPoint,
  Role,
  SkillCategory,
} from "./common";
import type { TrustScoreBreakdown } from "./ports/trust.port";

interface BaseEvent {
  occurredAt: string;
}

export interface UserRegisteredEvent extends BaseEvent {
  type: "UserRegistered";
  userId: string;
  role: Role;
  email: string;
}

export interface ServiceRequestCreatedEvent extends BaseEvent {
  type: "ServiceRequestCreated";
  serviceRequestId: string;
  homeownerId: string;
  category: SkillCategory;
  location: GeoPoint;
}

export interface MatchOfferedEvent extends BaseEvent {
  type: "MatchOffered";
  matchId: string;
  serviceRequestId: string;
  artisanId: string;
}

export interface MatchAcceptedEvent extends BaseEvent {
  type: "MatchAccepted";
  matchId: string;
  serviceRequestId: string;
  artisanId: string;
  homeownerId: string;
  jobId: string;
}

export interface JobCompletedEvent extends BaseEvent {
  type: "JobCompleted";
  jobId: string;
  artisanId: string;
  homeownerId: string;
  completedAt: string;
}

export interface ReviewSubmittedEvent extends BaseEvent {
  type: "ReviewSubmitted";
  reviewId: string;
  jobId: string;
  artisanId: string;
  rating: number;
  verificationHash: string;
}

export interface CredentialSubmittedEvent extends BaseEvent {
  type: "CredentialSubmitted";
  credentialId: string;
  artisanId: string;
  credentialType: CredentialType;
}

export interface CredentialApprovedEvent extends BaseEvent {
  type: "CredentialApproved";
  credentialId: string;
  artisanId: string;
  reviewedBy: string;
}

export interface CredentialRejectedEvent extends BaseEvent {
  type: "CredentialRejected";
  credentialId: string;
  artisanId: string;
  reviewedBy: string;
  reason?: string;
}

export interface TrustScoreUpdatedEvent extends BaseEvent {
  type: "TrustScoreUpdated";
  artisanId: string;
  score: number;
  breakdown: TrustScoreBreakdown;
}

export interface IdentityVerifiedEvent extends BaseEvent {
  type: "IdentityVerified";
  artisanId: string;
  reviewedBy: string;
}

export interface BlockchainRecordWrittenEvent extends BaseEvent {
  type: "BlockchainRecordWritten";
  recordId: string;
  refId: string;
  recordType: BlockchainRecordType;
  txHash: string;
  network: BlockchainNetwork;
}

export interface MessageSentEvent extends BaseEvent {
  type: "MessageSent";
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
}

export interface DisputeRaisedEvent extends BaseEvent {
  type: "DisputeRaised";
  disputeId: string;
  jobId: string;
  raisedBy: string;
}

export interface DisputeResolvedEvent extends BaseEvent {
  type: "DisputeResolved";
  disputeId: string;
  jobId: string;
  resolution: string;
}

export type DomainEvent =
  | UserRegisteredEvent
  | ServiceRequestCreatedEvent
  | MatchOfferedEvent
  | MatchAcceptedEvent
  | JobCompletedEvent
  | ReviewSubmittedEvent
  | CredentialSubmittedEvent
  | CredentialApprovedEvent
  | CredentialRejectedEvent
  | TrustScoreUpdatedEvent
  | IdentityVerifiedEvent
  | BlockchainRecordWrittenEvent
  | MessageSentEvent
  | DisputeRaisedEvent
  | DisputeResolvedEvent;

export type DomainEventType = DomainEvent["type"];

export type DomainEventOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;
