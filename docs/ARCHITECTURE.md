# VEYRO — System Architecture

## Why a modular monolith

VEYRO is decomposed into eight bounded services — **Authentication, User, Matching, Trust, Chat,
Notification, Blockchain, AI Recommendation** — each with a clear responsibility, its own data
ownership, and a defined extraction path to a real microservice later. For a project of this size,
running all eight inside one deployable Next.js app (a *modular monolith*) is the practical choice:
one Postgres connection pool, one deploy target, no network hops between services that mostly call
each other in the same request. What matters for the "microservice-ready" requirement is that the
**boundaries are real**, not the deployment topology — every rule below is what makes physically
splitting a service later a refactor, not a rewrite.

## Topology

```
                         ┌─────────────────────────────────────────┐
                         │     apps/web — Next.js (Vercel)          │
                         │     app/api/*  = API GATEWAY / BFF       │
                         │     (thin route handlers only — no       │
                         │      business logic lives here)          │
                         └───────────────┬───────────────────────────┘
                                         │ calls service ports (in-process today,
                                         │ HTTP/gRPC after extraction)
        ┌────────────┬─────────────┬─────┴───────┬─────────────┬─────────────┬──────────────┐
        ▼            ▼             ▼             ▼             ▼             ▼              ▼
   Auth Service  User Service  Matching     Trust Service  Chat Service  Notification  Blockchain
   (credentials, (profiles:    Service      (credential    (conversa-   Service        Service
   sessions,     homeowner/   (requests,    verification,  tions,       (fan-out to    (on-chain
   roles)        artisan,     matches,      trust score    messages)    in-app/        writes,
                 availability,job lifecycle, engine,                    push/email)    BlockchainRecord
                 portfolio)   reviews)      denormalized                               mirror)
                                            stats)
                                              ▲
                                              │ sync call
                                         AI Recommendation Service
                                         (ranks eligible artisans;
                                          pure function over inputs)

   Cross-cutting "platform" layer shared by all services (apps/web/platform/):
   EventBus · PrismaClient · ServiceRegistry/DI wiring · Socket.io client ·
   Cloudinary · Mapbox · NextAuth session glue · realtime-token signing
```

| Service | Folder | Owns (Postgres schema) |
|---|---|---|
| Authentication | `apps/web/services/auth` | `auth` — `User`, `AdminActionLog` |
| User | `apps/web/services/user` | `user` — `HomeownerProfile`, `ArtisanProfile`, `ArtisanAvailability`, `PortfolioItem` |
| Matching | `apps/web/services/matching` | `matching` — `ServiceRequest`, `Match`, `Job`, `Review`, `Dispute` |
| Trust | `apps/web/services/trust` | `trust` — `Credential`, `TrustProfile`, `TrustScoreHistory` |
| Chat | `apps/web/services/chat` | `chat` — `Conversation`, `Message` |
| Notification | `apps/web/services/notification` | `notification` — `Notification` |
| Blockchain | `apps/web/services/blockchain` | `blockchain` — `BlockchainRecord` |
| AI Recommendation | `apps/web/services/ai-recommendation` | `ai` — `RecommendationLog` (optional, evaluation only) |

`apps/realtime` is **not** a ninth service — it's the websocket transport adapter for Matching
(live offer/response cards) and Chat (live messages), split internally into `matching-gateway/`
and `chat-gateway/` so each could deploy alongside its corresponding service later. `apps/chain` is
Blockchain Service's *infrastructure* (the Solidity contracts + deploy scripts); the service's
business logic lives in `services/blockchain` inside the monolith.

## Communication rules

These are what make future extraction a refactor instead of a rewrite — every service follows them
today even though nothing forces it yet.

1. **A service's repository file is the only code allowed to query its own schema's models.**
   E.g. only `services/trust/trust.repository.ts` imports `prisma.credential`/`prisma.trustProfile`.
2. **Cross-service references are plain scalar IDs, never a live join or a Prisma `@relation`** —
   with exactly one documented exception (see `docs/DATABASE.md`).
3. **Synchronous calls** (`packages/contracts`' `*ServicePort` interfaces) are for when an
   immediate answer is required: the API gateway calling any service, or Matching calling AI
   Recommendation (`rank`) and User (`getArtisanCandidates`). These are direct TypeScript calls
   today; the same interface becomes a REST/gRPC call after extraction.
4. **Asynchronous events** (`apps/web/platform/event-bus.ts`, a typed wrapper over Node's
   `EventEmitter`) are for fan-out and eventual consistency — a service never reads another
   service's tables to find out what happened, it subscribes to that service's event instead.
   Trust subscribes to Matching's `JobCompleted`/`ReviewSubmitted`/`MatchAccepted` to update its
   *own* denormalized counters; Chat subscribes to `MatchAccepted` to auto-create a conversation;
   Notification subscribes to nearly everything; Blockchain subscribes to `IdentityVerified` /
   `CredentialApproved` / `TrustScoreUpdated` / `ReviewSubmitted` to anchor records on-chain
   asynchronously. `platform/service-registry.ts` wires all subscriptions once at boot
   (`instrumentation.ts`). Swapping the in-process `EventBus` for SQS/RabbitMQ/Kafka later changes
   one file, not every service.
5. **Blockchain writes never block the request that triggered them.** `BlockchainServicePort
   .enqueueRecord` returns immediately with a `PENDING` row; `services/blockchain/blockchain.worker.ts`
   performs the actual chain write off the request path (today: `setImmediate`; after extraction:
   a queue consumer) and flips the record to `CONFIRMED`/`FAILED`.

## Extraction order

When/if a service needs to become a real standalone deployment, the order matters:

1. **Blockchain** — already async/worker-shaped, least latency-sensitive, easiest to lift out.
2. **Chat** — already isolated, transport already separated into `apps/realtime`.
3. **Notification** — pure fan-out consumer, nothing else depends on it synchronously.
4. **Trust**, then **Matching** last — these are the most central and currently the most
   interdependent, so they're extracted only once the lighter services have proven the pattern.

## AI Recommendation Service

`services/ai-recommendation/eligibility.ts` applies hard gates (category match, `VERIFIED` status,
available now, within the artisan's own service radius) — failing any of these excludes a candidate
from ranking entirely. `services/ai-recommendation/scoring.ts` then applies the weighted formula
(`0.35×skillMatch + 0.20×distance + 0.15×experience + 0.30×trust`, refined from the brief — see that
file's doc comment for exactly how each term is normalized to `[0,1]`).

## Trust Score Engine

`services/trust/trust-score-engine.ts` implements the weighted formula from the brief
(`20% identity + 20% credentials + 25% ratings + 15% reviews + 10% completion rate + 10% response
time`, each normalized to `[0,1]` before weighting, scaled to a 0-100 score). It's a pure function
with no infrastructure dependency, so it's fully implemented now rather than deferred.

## Known environment quirks (this build)

- Next.js 16 renamed `middleware.ts`/`export function middleware` to `proxy.ts`/`export function proxy`
  — `apps/web/proxy.ts` already uses the new name.
- `params`/`searchParams` are `Promise`s in Next 16 route handlers and pages — every dynamic route
  in this codebase already `await`s them.
- Prisma is pinned to `6.19.3` (not the `7.x` "latest" tag) — Prisma 7 requires ESM-only output and
  mandatory driver adapters, which adds risk disproportionate to this project's needs.
- Hardhat is pinned to `2.28.6` + `@nomicfoundation/hardhat-toolbox@6.1.2` (not Hardhat 3), for the
  same reason — Hardhat 3 changes the config/plugin model significantly.
- NextAuth is pinned to the `5.0.0-beta` line (Auth.js v5) rather than the `4.x` "latest" tag, since
  v5 is what properly supports the App Router's Route Handler + Server Component session model.
