# VEYRO

AI-driven, blockchain-trusted artisan–homeowner matching platform. *Connecting Homes with Trusted Hands.*

VEYRO is built as a **microservice-ready modular monolith**: eight bounded services (Auth, User, Matching, Trust, Chat, Notification, Blockchain, AI Recommendation) live inside one Next.js app today, each with its own Postgres schema and a typed in-process event bus standing in for a future message broker — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design.

---

## Monorepo layout

```
apps/
  web/        Next.js 16 (App Router) — UI + API gateway + all 8 services + Prisma schema
  realtime/   Socket.io server — live matching + chat transport (Express)
  chain/      Hardhat project — 4 Solidity trust contracts
packages/
  contracts/  Shared TypeScript port interfaces + domain events
  config/     Shared tsconfig base
docs/
  ARCHITECTURE.md   8-service diagram, communication rules, extraction order
  DATABASE.md       Schema-per-service breakdown
  API.md            Full API route list grouped by service
```

---

## Local development

### 1. Prerequisites

- Node.js ≥ 20
- pnpm (or use `npx -y pnpm@9` if global install is not available)

### 2. Install

```bash
npx -y pnpm@9 install
```

### 3. Environment variables

```bash
cp apps/web/.env.example apps/web/.env
cp apps/realtime/.env.example apps/realtime/.env
```

Minimum required in `apps/web/.env`:
- `DATABASE_URL` — your Neon Postgres connection string
- `DIRECT_DATABASE_URL` — same as DATABASE_URL for local
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `REALTIME_JWT_SECRET` — run `openssl rand -base64 32`

Copy the same `REALTIME_JWT_SECRET` into `apps/realtime/.env`.

### 4. Database

```bash
npx -y pnpm@9 --filter web exec prisma generate
npx -y pnpm@9 --filter web exec prisma migrate dev --name init
```

### 5. Run all services

Open three terminals:

```bash
# Terminal 1 — Next.js app
npx -y pnpm@9 --filter web dev          # http://localhost:3000

# Terminal 2 — Socket.io realtime server
npx -y pnpm@9 --filter realtime dev     # ws://localhost:4001

# Terminal 3 — Hardhat local blockchain (optional — app works without it)
cd apps/chain
npx hardhat node                         # keep running
npx hardhat run scripts/deploy.ts --network localhost   # run once, paste output into .env
```

### 6. Optional integrations

| Integration | Without it | How to enable |
|---|---|---|
| Cloudinary | File uploads fail | [cloudinary.com](https://cloudinary.com/users/register_free) — free, paste 3 keys into `.env` |
| Mapbox | All jobs use Lagos centre GPS | [mapbox.com](https://account.mapbox.com/auth/signup) — free, paste token into `.env` |
| Hardhat blockchain | Simulated tx hashes | Run `npx hardhat node` in `apps/chain` (see step 5) |

---

## Production deployment

### Architecture

```
Vercel                    Railway (or Render)       Polygon Amoy (testnet)
──────────────────        ───────────────────       ──────────────────────
apps/web (Next.js)  ───►  apps/realtime             4 Solidity contracts
                          (Socket.io)
         │
         └──► Neon Postgres (cloud)
         └──► Cloudinary (file uploads)
         └──► Mapbox (geocoding)
```

### Step 1 — Blockchain contracts (Polygon Amoy testnet)

1. Create a free [Alchemy](https://alchemy.com) account → New App → Polygon Amoy → copy the HTTPS URL
2. Create a **dedicated** testnet wallet (MetaMask → Account Details → Export private key). Never use a wallet with real funds.
3. Fund it with free test MATIC from [faucet.polygon.technology](https://faucet.polygon.technology)
4. Add to `apps/chain/.env`:
   ```
   CHAIN_RPC_URL=<your Alchemy Amoy HTTPS URL>
   CHAIN_PRIVATE_KEY=<your testnet wallet private key>
   ```
5. Deploy:
   ```bash
   cd apps/chain
   npx hardhat run scripts/deploy.ts --network polygonAmoy
   ```
6. Copy the 4 printed contract addresses — you'll paste them into Vercel env vars.

### Step 2 — Deploy the realtime server (Railway)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the **`veyro`** repo and set the **root directory** to `apps/realtime`
3. Railway auto-detects `railway.toml` and runs `npm run build && npm run start`
4. Set these environment variables in Railway:
   ```
   REALTIME_JWT_SECRET=<same secret as apps/web>
   WEB_INTERNAL_URL=https://your-vercel-domain.vercel.app
   WEB_PUBLIC_URL=https://your-vercel-domain.vercel.app
   PORT=4001
   ```
5. Copy the Railway public URL (e.g. `https://veyro-realtime.up.railway.app`)

### Step 3 — Deploy the web app (Vercel)

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `apps/web`
3. Vercel auto-detects `vercel.json` and runs the correct monorepo build command
4. Set these environment variables in Vercel:

   **Database (Neon)**
   ```
   DATABASE_URL=<Neon pooled connection string ending in -pooler ...&pgbouncer=true>
   DIRECT_DATABASE_URL=<Neon direct connection string (non-pooled)>
   ```
   > In your Neon dashboard, go to your project → Connection Details → switch to "Pooled connection"

   **Auth**
   ```
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://your-vercel-domain.vercel.app
   ```

   **Realtime**
   ```
   REALTIME_JWT_SECRET=<same as Railway>
   NEXT_PUBLIC_SOCKET_URL=https://veyro-realtime.up.railway.app
   REALTIME_INTERNAL_URL=https://veyro-realtime.up.railway.app
   ```

   **Cloudinary**
   ```
   CLOUDINARY_CLOUD_NAME=<from Cloudinary dashboard>
   CLOUDINARY_API_KEY=<from Cloudinary dashboard>
   CLOUDINARY_API_SECRET=<from Cloudinary dashboard>
   ```

   **Mapbox**
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=<from mapbox.com account>
   ```

   **Blockchain**
   ```
   CHAIN_NETWORK=POLYGON_AMOY
   CHAIN_RPC_URL=<Alchemy Amoy HTTPS URL>
   CHAIN_PRIVATE_KEY=<testnet wallet private key>
   IDENTITY_CONTRACT_ADDRESS=<from Step 1>
   CREDENTIAL_CONTRACT_ADDRESS=<from Step 1>
   REPUTATION_CONTRACT_ADDRESS=<from Step 1>
   TRUST_SCORE_CONTRACT_ADDRESS=<from Step 1>
   ```

5. Deploy → run database migrations from your local machine pointing at production:
   ```bash
   DATABASE_URL="<Neon direct URL>" npx -y pnpm@9 --filter web exec prisma migrate deploy
   ```

---

## Roadmap

- [x] **Phase 1** — System architecture (8-service modular monolith, communication rules, DB strategy)
- [x] **Phase 2** — Project setup + monorepo scaffold
- [x] **Phase 3** — Database schema (one Postgres schema per service, Prisma multiSchema)
- [x] **Phase 4** — API design and gateway route stubs
- [x] **Phase 5** — Landing page + homeowner dashboard
- [x] **Phase 6** — Artisan dashboard + 8-step onboarding wizard
- [x] **Phase 7** — Matching engine (live Socket.io broadcast, offer cards, accept flow)
- [x] **Phase 8** — Chat system (real-time messages, unread counts, read receipts)
- [x] **Phase 9** — Blockchain module (Hardhat local + Polygon Amoy, on-chain trust anchoring)
- [x] **Phase 10** — AI recommendation engine UI (weighted ranking surfaced on homeowner dashboard)
- [x] **Phase 11** — Admin dashboard (stats console, verification queue, dispute resolution)
- [x] **Phase 12** — Production deployment config (Vercel + Railway + Polygon Amoy)
