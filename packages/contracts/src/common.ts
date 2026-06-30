export type Role = "HOMEOWNER" | "ARTISAN" | "ADMIN";

export type SkillCategory =
  | "ELECTRICIAN"
  | "PLUMBER"
  | "CARPENTER"
  | "PAINTER"
  | "WELDER"
  | "SOLAR_TECHNICIAN"
  | "CCTV_INSTALLER"
  | "INTERIOR_DECORATOR";

export type ExperienceLevel = "0-2" | "3-5" | "6-10" | "10+";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type CredentialType =
  | "NIN"
  | "NATIONAL_ID"
  | "DRIVERS_LICENSE"
  | "PASSPORT"
  | "UTILITY_BILL"
  | "BANK_STATEMENT"
  | "TRADE_CERTIFICATE"
  | "LICENSE"
  | "OTHER";

export type CredentialStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ServiceRequestStatus =
  | "SEARCHING"
  | "MATCHED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MatchStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export type JobStatus = "ACTIVE" | "COMPLETED" | "DISPUTED" | "CANCELLED";

export type DisputeStatus = "OPEN" | "RESOLVED" | "REJECTED";

export type MessageType = "TEXT" | "IMAGE" | "LOCATION";

export type NotificationType =
  | "MATCH_OFFERED"
  | "MATCH_ACCEPTED"
  | "JOB_COMPLETED"
  | "CREDENTIAL_APPROVED"
  | "CREDENTIAL_REJECTED"
  | "TRUST_SCORE_UPDATED"
  | "MESSAGE_RECEIVED"
  | "DISPUTE_RAISED"
  | "DISPUTE_RESOLVED";

export type BlockchainRecordType =
  | "IDENTITY_VERIFIED"
  | "CREDENTIAL_VERIFIED"
  | "TRUST_SCORE_UPDATE"
  | "REVIEW_HASH"
  | "DISPUTE_RESOLUTION";

export type BlockchainRecordStatus = "PENDING" | "CONFIRMED" | "FAILED";

export type BlockchainNetwork = "HARDHAT_LOCAL" | "POLYGON_AMOY";

export interface GeoPoint {
  lat: number;
  lng: number;
}
