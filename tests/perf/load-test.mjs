/**
 * VEYRO Load & Response-Time Test
 * Targets: review→trust-score path, AI matching, blockchain enqueue
 * Run: node tests/perf/load-test.mjs
 * Requires: app running on localhost:3000, valid ADMIN session cookie in env
 *
 * Usage:
 *   VEYRO_BASE=http://localhost:3000 VEYRO_COOKIE="next-auth.session-token=..." node tests/perf/load-test.mjs
 */

import { performance } from "node:perf_hooks";

const BASE = process.env.VEYRO_BASE ?? "http://localhost:3000";
const COOKIE = process.env.VEYRO_COOKIE ?? "";
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 10);
const ITERATIONS = Number(process.env.ITERATIONS ?? 50);

// ─── helpers ──────────────────────────────────────────────────────────────────

function headers(extra = {}) {
  return {
    "Content-Type": "application/json",
    ...(COOKIE ? { Cookie: COOKIE } : {}),
    ...extra,
  };
}

async function timed(label, fn) {
  const start = performance.now();
  let status = "ok";
  let error = null;
  try {
    await fn();
  } catch (e) {
    status = "error";
    error = e.message;
  }
  const ms = performance.now() - start;
  return { label, ms, status, error };
}

async function batch(label, n, concurrency, fn) {
  const results = [];
  for (let i = 0; i < n; i += concurrency) {
    const slice = Math.min(concurrency, n - i);
    const batch = await Promise.all(
      Array.from({ length: slice }, (_, j) => timed(label, () => fn(i + j))),
    );
    results.push(...batch);
  }
  return results;
}

function stats(results) {
  const times = results.filter((r) => r.status === "ok").map((r) => r.ms).sort((a, b) => a - b);
  const errors = results.filter((r) => r.status === "error").length;
  if (times.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, errors, total: results.length };
  const p = (pct) => times[Math.floor((pct / 100) * times.length)] ?? times[times.length - 1];
  return {
    min: Math.round(times[0]),
    max: Math.round(times[times.length - 1]),
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    p50: Math.round(p(50)),
    p95: Math.round(p(95)),
    p99: Math.round(p(99)),
    errors,
    total: results.length,
  };
}

function printStats(label, s) {
  console.log(`\n📊 ${label}`);
  console.log(`   Total requests : ${s.total}  |  Errors: ${s.errors}`);
  console.log(`   min ${s.min}ms  avg ${s.avg}ms  p50 ${s.p50}ms  p95 ${s.p95}ms  p99 ${s.p99}ms  max ${s.max}ms`);
}

// ─── suites ───────────────────────────────────────────────────────────────────

/** 1. Marketing pages — baseline latency (no auth, pure SSR) */
async function testPublicPages() {
  const paths = ["/", "/how-it-works", "/for-artisans", "/for-homeowners", "/trust", "/faq"];
  const results = await batch("public-pages", paths.length * 5, 6, async (i) => {
    const path = paths[i % paths.length];
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.text();
  });
  printStats("Public pages (SSR baseline)", stats(results));
  return results;
}

/** 2. AI recommendations endpoint — /api/ai/recommendations?serviceRequestId=X */
async function testAiMatchingEndpoint() {
  const results = await batch("ai-matching", ITERATIONS, CONCURRENCY, async () => {
    // Without a valid serviceRequestId it returns 400 "Service request not found"
    // but the full middleware + DB lookup runs — measures true stack latency.
    const res = await fetch(`${BASE}/api/ai/recommendations?serviceRequestId=probe-${Math.random()}`, {
      headers: headers(),
    });
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    await res.json().catch(() => res.text());
  });
  printStats(`AI recommendations endpoint (${ITERATIONS} requests @ concurrency ${CONCURRENCY})`, stats(results));
  return results;
}

/** 3. Blockchain records read path — /api/trust/records/[refId] */
async function testBlockchainReadPath() {
  const results = await batch("blockchain-read", ITERATIONS, CONCURRENCY, async () => {
    const res = await fetch(`${BASE}/api/trust/records/probe-${Math.random()}`, {
      headers: headers(),
    });
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    await res.json().catch(() => res.text());
  });
  printStats(`Blockchain records read path (${ITERATIONS} requests @ concurrency ${CONCURRENCY})`, stats(results));
  return results;
}

/** 4. Review → trust score path — POST /api/jobs/[id]/review (full middleware stack) */
async function testReviewTrustScorePath() {
  const results = await batch("review-trust-path", ITERATIONS, CONCURRENCY, async () => {
    const res = await fetch(`${BASE}/api/jobs/probe-id/review`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ rating: 5, comment: "Load test probe" }),
    });
    // 401/403/404 expected — measures middleware + session check + route handler latency
    if (res.status >= 500) throw new Error(`HTTP ${res.status} — server error`);
    await res.json().catch(() => res.text());
  });
  printStats(`Review → trust-score path (${ITERATIONS} requests @ concurrency ${CONCURRENCY})`, stats(results));
  return results;
}

/** 5. Public artisans listing — actual DB query under load */
async function testArtisansListing() {
  const results = await batch("artisans-listing", ITERATIONS, CONCURRENCY, async () => {
    const res = await fetch(`${BASE}/api/artisans`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json();
  });
  printStats(`Artisans listing API (${ITERATIONS} requests @ concurrency ${CONCURRENCY})`, stats(results));
  return results;
}

/** 5. Concurrent homepage load — simulates multiple users hitting the landing page */
async function testConcurrentHomepage() {
  const n = 100;
  const results = await batch("homepage-concurrent", n, 20, async () => {
    const res = await fetch(`${BASE}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.text();
  });
  printStats(`Homepage under 100 concurrent users (batches of 20)`, stats(results));
  return results;
}

// ─── main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log("═".repeat(60));
  console.log("  VEYRO Performance Load Test");
  console.log(`  Target: ${BASE}`);
  console.log(`  Concurrency: ${CONCURRENCY}  |  Iterations: ${ITERATIONS}`);
  console.log("═".repeat(60));

  await testPublicPages();
  await testConcurrentHomepage();
  await testArtisansListing();
  await testReviewTrustScorePath();
  await testAiMatchingEndpoint();
  await testBlockchainReadPath();

  console.log("\n" + "═".repeat(60));
  console.log("  Done.");
  console.log("═".repeat(60));
})();
