# VEYRO — Database Strategy

Single Postgres database (Neon recommended), one **native Postgres schema per service** via
Prisma's `multiSchema` feature (`apps/web/prisma/schema.prisma`). This is the standard
modular-monolith → microservices migration path: logical separation now, a `pg_dump`-per-schema
physical split later, with no application rewrite.

## Schemas

| Schema | Models | Owning service |
|---|---|---|
| `auth` | `User`, `AdminActionLog` | Authentication |
| `user` | `HomeownerProfile`, `ArtisanProfile`, `ArtisanAvailability`, `PortfolioItem` | User |
| `matching` | `ServiceRequest`, `Match`, `Job`, `Review`, `Dispute` | Matching |
| `trust` | `Credential`, `TrustProfile`, `TrustScoreHistory` | Trust |
| `chat` | `Conversation`, `Message` | Chat |
| `notification` | `Notification` | Notification |
| `blockchain` | `BlockchainRecord` | Blockchain |
| `ai` | `RecommendationLog` (optional, evaluation only) | AI Recommendation |

Each service's `*.repository.ts` (e.g. `services/trust/trust.repository.ts`) is the **only** file
allowed to import `PrismaClient` for its own schema's models — this is the code-level enforcement
of the DB-level separation.

## The one cross-service foreign key

`user.HomeownerProfile.userId` and `user.ArtisanProfile.userId` have a real Prisma `@relation` (and
therefore a real FK) to `auth.User.id`. This is the single deliberate exception to "no cross-service
joins": *which auth identity a profile belongs to* is core referential integrity, not a business
read. Prisma's `multiSchema` feature explicitly supports a model in one `@@schema` relating to a
model in another, which is what makes this possible without duplicating the `User` table.

Convention enforced by review, not by the schema: User Service code must never `select`/`include`
anything on the related `User` row beyond `id` — `email`/`passwordHash`/`role` belong to Auth
Service. On physical split, this FK is replaced by a local denormalized `{ userId, role }` copy on
`ArtisanProfile`/`HomeownerProfile`, kept in sync via the `UserRegistered` event.

## Shared vocabulary vs. owned data

`SkillCategory` (the artisan trade taxonomy) is defined once, in the `user` schema, and referenced
directly by `matching.ServiceRequest.category` and `ai.RecommendationLog.category` — Prisma's
`multiSchema` feature allows this. This is safe to single-source because it's a **value type** (a
fixed enum, no aggregate data), unlike a table reference. At physical-split time, each service would
get its own copy of this enum (a few lines), which is a cheap duplication compared to what a real
cross-service join would cost.

Every other cross-service reference (`ServiceRequest.homeownerId`, `Match.artisanId`,
`Credential.artisanId`, `Conversation.homeownerId`/`artisanId`, `Notification.userId`,
`BlockchainRecord.refId`, …) is a **plain scalar string field with no FK** — exactly how an
independent microservice would store a foreign aggregate's ID.

## Denormalization: authoritative record vs. cache

`trust.TrustProfile` is the **authoritative** trust/reputation record — `verificationStatus`,
`trustScore`, `ratingAvg`, `ratingCount`, `completedJobs`, `totalJobsAccepted`,
`responseTimeAvgSeconds`. It's written only by Trust Service, and only in reaction to:

- Admin actions (`verifyIdentity`, `reviewCredential`) called directly through `TrustServicePort`.
- Events from Matching (`MatchAccepted` → `totalJobsAccepted++`, `JobCompleted` →
  `completedJobs++` + recalculate, `ReviewSubmitted` → incremental rating average + recalculate).
  See `services/trust/trust.events.ts`.

`user.ArtisanProfile` keeps its **own cache** of a subset of those same fields
(`verificationStatus`, `trustScore`, `ratingAvg`, `ratingCount`, `completedJobs`,
`responseTimeAvgSeconds`), synced via the same `TrustScoreUpdated`/`IdentityVerified` events. This
duplication is deliberate (CQRS-style read model): User Service's candidate search
(`getArtisanCandidates`, called on every matching request) needs a fast local read of trust data
without a synchronous cross-service call for every candidate. Both copies are kept eventually
consistent by the same event, which is the same mechanism a real microservice split would use.

## Enum naming note

Prisma enum identifiers can't be `"0-2"`, `"3-5"`, etc., so `user.ExperienceLevel` uses
`ZERO_TO_TWO` / `THREE_TO_FIVE` / `SIX_TO_TEN` / `TEN_PLUS` internally. The translation to/from the
contract DTO's `"0-2" | "3-5" | "6-10" | "10+"` happens at exactly one place:
`services/user/experience-level.map.ts`.
