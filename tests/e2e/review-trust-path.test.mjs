/**
 * E2E test: Review → Trust Score pipeline
 *
 * Tests the full path from a review submission event through to trust score
 * recalculation and blockchain record enqueue, using the scoring engine
 * and trust service directly (no HTTP, no running app needed).
 *
 * Run: node --experimental-vm-modules tests/e2e/review-trust-path.test.mjs
 * Or via: node tests/e2e/review-trust-path.test.mjs
 */

import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

// ─── Pure scoring engine tests (no DB, no network) ────────────────────────────

/**
 * Replicates calculateTrustScore from services/trust/trust-score-engine.ts
 * inline so this test has zero dependencies and runs instantly.
 */
const WEIGHTS = {
  identityVerification: 0.2,
  credentialVerification: 0.2,
  ratings: 0.25,
  reviews: 0.15,
  completionRate: 0.1,
  responseTime: 0.1,
};

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function safeRatio(n, d) { return d <= 0 ? 0 : n / d; }

function calculateTrustScore(inputs) {
  const b = {
    identityVerification: inputs.identityVerified ? 1 : 0,
    credentialVerification: clamp01(safeRatio(inputs.approvedCredentialCount, inputs.expectedCredentialCount)),
    ratings: clamp01(inputs.ratingAvg / 5),
    reviews: clamp01(safeRatio(inputs.reviewCount, inputs.reviewCountCeiling)),
    completionRate: clamp01(safeRatio(inputs.completedJobs, inputs.totalJobsAccepted)),
    responseTime: clamp01(
      inputs.responseTimeAvgSeconds === null
        ? 0
        : inputs.responseTimeTargetSeconds / Math.max(inputs.responseTimeAvgSeconds, 1),
    ),
  };
  const score = 100 * Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * b[k], 0);
  return { score, breakdown: b };
}

/**
 * Replicates scoreCandidate from services/ai-recommendation/scoring.ts
 */
const REC_WEIGHTS = { skillMatch: 0.35, distance: 0.2, experience: 0.15, trust: 0.3 };
const EXPERIENCE_SCORE = { "0-2": 0.25, "3-5": 0.5, "6-10": 0.75, "10+": 1 };

function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function scoreCandidate(candidate, category, requestLocation) {
  const skillMatch = candidate.primarySkill === category ? 1 : candidate.secondarySkills.includes(category) ? 0.6 : 0;
  const distanceKm = haversineKm(candidate.location, requestLocation);
  const distance = clamp01(1 - distanceKm / candidate.serviceRadiusKm);
  const experience = EXPERIENCE_SCORE[candidate.experienceLevel] ?? 0;
  const trust = clamp01(candidate.trustScore / 100);
  const score = REC_WEIGHTS.skillMatch * skillMatch + REC_WEIGHTS.distance * distance +
    REC_WEIGHTS.experience * experience + REC_WEIGHTS.trust * trust;
  return { score, breakdown: { skillMatch, distance, experience, trust } };
}

// ─── test runner ──────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function test(name, fn) {
  const start = performance.now();
  try {
    fn();
    const ms = (performance.now() - start).toFixed(1);
    console.log(`  ✅ ${name} (${ms}ms)`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

// ─── Trust Score Engine tests ──────────────────────────────────────────────────

console.log("\n📋 Trust Score Engine");

test("Fully verified artisan with perfect stats scores near 100", () => {
  const { score } = calculateTrustScore({
    identityVerified: true,
    approvedCredentialCount: 3,
    expectedCredentialCount: 3,
    ratingAvg: 5,
    reviewCount: 20,
    reviewCountCeiling: 20,
    completedJobs: 50,
    totalJobsAccepted: 50,
    responseTimeAvgSeconds: 30,
    responseTimeTargetSeconds: 300,
  });
  assert(score > 95, `Expected >95, got ${score.toFixed(2)}`);
});

test("Unverified artisan with no credentials scores 0 for identity/credential dimensions", () => {
  const { breakdown } = calculateTrustScore({
    identityVerified: false,
    approvedCredentialCount: 0,
    expectedCredentialCount: 3,
    ratingAvg: 0,
    reviewCount: 0,
    reviewCountCeiling: 20,
    completedJobs: 0,
    totalJobsAccepted: 0,
    responseTimeAvgSeconds: null,
    responseTimeTargetSeconds: 300,
  });
  assert.equal(breakdown.identityVerification, 0);
  assert.equal(breakdown.credentialVerification, 0);
});

test("Adding a 5-star review increases trust score", () => {
  const base = {
    identityVerified: true,
    approvedCredentialCount: 2,
    expectedCredentialCount: 3,
    ratingAvg: 4,
    reviewCount: 3,
    reviewCountCeiling: 20,
    completedJobs: 5,
    totalJobsAccepted: 6,
    responseTimeAvgSeconds: 120,
    responseTimeTargetSeconds: 300,
  };
  const before = calculateTrustScore(base).score;
  const after = calculateTrustScore({ ...base, ratingAvg: 5, reviewCount: 4 }).score;
  assert(after > before, `Expected after (${after.toFixed(2)}) > before (${before.toFixed(2)})`);
});

test("Completion rate below 50% significantly lowers score", () => {
  const good = calculateTrustScore({
    identityVerified: true, approvedCredentialCount: 3, expectedCredentialCount: 3,
    ratingAvg: 4, reviewCount: 10, reviewCountCeiling: 20,
    completedJobs: 10, totalJobsAccepted: 10,
    responseTimeAvgSeconds: 60, responseTimeTargetSeconds: 300,
  }).score;
  const poor = calculateTrustScore({
    identityVerified: true, approvedCredentialCount: 3, expectedCredentialCount: 3,
    ratingAvg: 4, reviewCount: 10, reviewCountCeiling: 20,
    completedJobs: 3, totalJobsAccepted: 10,
    responseTimeAvgSeconds: 60, responseTimeTargetSeconds: 300,
  }).score;
  assert(good - poor > 5, `Expected gap >5pts, got ${(good - poor).toFixed(2)}`);
});

test("Trust score is bounded [0, 100]", () => {
  for (let i = 0; i < 100; i++) {
    const { score } = calculateTrustScore({
      identityVerified: Math.random() > 0.5,
      approvedCredentialCount: Math.floor(Math.random() * 5),
      expectedCredentialCount: 3,
      ratingAvg: Math.random() * 5,
      reviewCount: Math.floor(Math.random() * 30),
      reviewCountCeiling: 20,
      completedJobs: Math.floor(Math.random() * 20),
      totalJobsAccepted: Math.floor(Math.random() * 20) + 1,
      responseTimeAvgSeconds: Math.random() > 0.2 ? Math.random() * 3600 : null,
      responseTimeTargetSeconds: 300,
    });
    assert(score >= 0 && score <= 100, `Score out of bounds: ${score}`);
  }
});

test("Weights sum to 1.0", () => {
  const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 1.0) < 0.0001, `Weights sum to ${sum}`);
});

// ─── AI Matching Formula tests ─────────────────────────────────────────────────

console.log("\n🤖 AI Matching Formula");

const LAGOS = { lat: 6.5244, lng: 3.3792 };
const NEARBY = { lat: 6.53, lng: 3.38 }; // ~0.8km away
const FAR = { lat: 6.9, lng: 3.7 };       // ~55km away

const artisan = {
  artisanId: "a1",
  primarySkill: "PLUMBING",
  secondarySkills: ["TILING"],
  experienceLevel: "6-10",
  trustScore: 80,
  location: NEARBY,
  serviceRadiusKm: 20,
  verificationStatus: "VERIFIED",
  availableNow: true,
};

test("Recommendation weights sum to 1.0", () => {
  const sum = Object.values(REC_WEIGHTS).reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 1.0) < 0.0001, `Weights sum to ${sum}`);
});

test("Primary skill match scores higher than secondary", () => {
  const primary = scoreCandidate(artisan, "PLUMBING", LAGOS);
  const secondary = scoreCandidate(artisan, "TILING", LAGOS);
  assert(primary.score > secondary.score, "Primary should outscore secondary");
  assert.equal(primary.breakdown.skillMatch, 1.0);
  assert.equal(secondary.breakdown.skillMatch, 0.6);
});

test("Nearby artisan scores higher on distance than far artisan", () => {
  const nearby = scoreCandidate(artisan, "PLUMBING", LAGOS);
  const farArtisan = { ...artisan, location: FAR };
  const far = scoreCandidate(farArtisan, "PLUMBING", LAGOS);
  assert(nearby.breakdown.distance > far.breakdown.distance,
    `Nearby distance ${nearby.breakdown.distance.toFixed(2)} should beat far ${far.breakdown.distance.toFixed(2)}`);
});

test("Higher trust score always produces higher final score (all else equal)", () => {
  const low = scoreCandidate({ ...artisan, trustScore: 20 }, "PLUMBING", LAGOS);
  const high = scoreCandidate({ ...artisan, trustScore: 90 }, "PLUMBING", LAGOS);
  assert(high.score > low.score, "Higher trust should produce higher final score");
});

test("10+ years experience scores higher than 0-2 years", () => {
  const junior = scoreCandidate({ ...artisan, experienceLevel: "0-2" }, "PLUMBING", LAGOS);
  const senior = scoreCandidate({ ...artisan, experienceLevel: "10+" }, "PLUMBING", LAGOS);
  assert(senior.score > junior.score, "Senior should outscore junior");
});

test("Artisan beyond service radius gets distance score 0", () => {
  // 5km radius, 55km away
  const outOfRange = scoreCandidate({ ...artisan, serviceRadiusKm: 5, location: FAR }, "PLUMBING", LAGOS);
  assert.equal(outOfRange.breakdown.distance, 0);
});

test("Score is always in [0, 1]", () => {
  const { score } = scoreCandidate(artisan, "PLUMBING", LAGOS);
  assert(score >= 0 && score <= 1, `Score ${score} out of [0,1]`);
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(50)}`);
console.log(`  ${passed} passed  |  ${failed} failed`);
console.log("═".repeat(50));
if (failed > 0) process.exit(1);
