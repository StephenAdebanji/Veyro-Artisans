# VEYRO — API Gateway

Every route below lives in `apps/web/app/api` and is a thin handler: validate input (Zod), call
into exactly one (occasionally two, for onboarding) service via its `packages/contracts` port,
return JSON. No route queries Prisma directly — see `docs/ARCHITECTURE.md`'s communication rules.

## Authentication Service

| Method | Path | Notes |
|---|---|---|
| `GET`/`POST` | `/api/auth/[...nextauth]` | NextAuth (Auth.js v5) sign-in/session/sign-out handlers |
| `POST` | `/api/auth/register` | Homeowner self-registration → `authService.register` + `userService.createHomeownerProfile` |

## Artisan onboarding (spans Auth, User, Trust)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/artisans/onboarding` | Step 1 (basic info) — creates the `User` (role `ARTISAN`) and a draft `ArtisanProfile`, returns `artisanId` |
| `PATCH` | `/api/artisans/onboarding/:id` | Steps 2-8 — body `{ step, data?, credentials? }`. Steps 2/3/7/8 (professional/location/portfolio/availability) go to `userService.updateArtisanOnboardingStep`; steps 4/5/6 (ID/proof of address/credentials) also call `trustService.submitCredential` once per uploaded file |
| `POST` | `/api/artisans/onboarding/:id/submit` | Final submit → `ArtisanOnboardingStatus.PENDING_REVIEW`, lands in the admin verification queue |

## User Service

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/artisans?category=&lat=&lng=&radiusKm=` | `userService.getArtisanCandidates` |
| `GET` | `/api/artisans/:id` | Public profile — `residentialAddress`/GPS stripped unless the caller session is `ADMIN` |
| `PATCH` | `/api/artisans/:id/availability` | Working days/hours, emergency availability |

## Matching Service

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/service-requests` | Creates a `ServiceRequest`; kicks off the live matching broadcast (Phase 7) |
| `GET` | `/api/service-requests/:id` | Current `ServiceRequestStatus` |
| `GET` | `/api/service-requests/:id/matches` | Poll fallback for the matching screen — list of offer cards |
| `POST` | `/api/service-requests/:id/offers` | An artisan submits a price/ETA offer — renders as a response card |
| `POST` | `/api/matches/:id/respond` | Homeowner's Accept/Decline on one offer card. `ACCEPT` creates the `Job` and expires every other pending offer |
| `POST` | `/api/jobs/:id/complete` | Marks a `Job` completed, emits `JobCompleted` |
| `POST` | `/api/jobs/:id/review` | Submits a rating/comment, emits `ReviewSubmitted` (Trust + Blockchain react to this) |

## AI Recommendation Service

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/ai/recommendations?serviceRequestId=` | Gathers candidates via User Service, ranks via `aiRecommendationService.rank` |

## Chat Service

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/conversations?userId=` | List conversations for a homeowner/artisan profile id |
| `GET` | `/api/conversations/:id/messages` | List messages in a conversation |
| `POST` | `/api/conversations/:id/messages` | Persist a message — this is the single write path; apps/realtime's chat-gateway calls this same route internally before fanning the result out live |

## Notification Service

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/notifications?userId=&unreadOnly=` | List in-app notifications |
| `POST` | `/api/notifications/:id/read` | Mark one notification read |

## Trust / Blockchain

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/trust/identity/verify` | **Admin only.** Marks an artisan's identity `VERIFIED`, recalculates trust score, triggers an async on-chain `IDENTITY_VERIFIED` record |
| `PATCH` | `/api/trust/credentials/:id` | **Admin only.** Approve/reject a credential upload; approval triggers an async on-chain `CREDENTIAL_VERIFIED` record |
| `GET` | `/api/trust/artisans/:id/score-history` | Trust score history (audit trail) |
| `GET` | `/api/trust/records/:refId` | On-chain record status/tx hash for any artisan/credential/review id |

## Admin

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/stats` | **Admin only.** Currently just `pendingVerifications`; total users/verified artisans/open reports need count methods on Auth/User/Matching — deferred to Phase 11 |
| `GET` | `/api/admin/verification-queue` | **Admin only.** Pending credential uploads awaiting review |

## Uploads

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/uploads/sign` | Cloudinary signed upload params, scoped to `veyro/{uploadType}/{sessionUserId}` — a client can never sign an upload into someone else's folder |

## Deferred to later phases

- Dispute raise/resolve endpoints (Matching owns `Dispute`, but no port method exists yet — Phase 11).
- Admin approve/reject-credential UI actions beyond the route above (Phase 11).
- Session→profile-id resolution for `userId` query params on the conversation/notification routes
  above currently trusts the caller-supplied id; Phase 5 wires this to the NextAuth session properly.
