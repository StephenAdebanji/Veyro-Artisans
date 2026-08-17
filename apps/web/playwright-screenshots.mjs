/**
 * VEYRO full-app screenshot crawler
 *
 * Covers every page/route in apps/web — public marketing, auth, artisan
 * onboarding (all 8 steps), homeowner, artisan, and admin authenticated flows.
 *
 * Usage:
 *   1. Start dev server:   cd apps/web && npx next dev   (leave running)
 *   2. In another terminal: node playwright-screenshots.mjs
 *   3. Screenshots land in ./screenshots/  then zipped to ./screenshots.zip
 *
 * Test credentials (from prisma/seed.ts — run `pnpm seed` first if needed):
 *   Admin:    admin@veyro.test     / Password123!
 *   Homeowner: folake@veyro.test   / Password123!
 *   Artisan:  emeka@veyro.test    / Password123!
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "screenshots");
const VIEWPORT = { width: 1440, height: 900 };

const CREDS = {
  admin: { email: "admin@veyro.test", password: "Password123!" },
  homeowner: { email: "folake@veyro.test", password: "Password123!" },
  artisan: { email: "emeka@veyro.test", password: "Password123!" },
};

// Unique email+phone so each run creates a fresh artisan for onboarding screenshots
const _RUN_ID = Date.now();
const ONBOARDING_EMAIL = `screenshot-${_RUN_ID}@veyro.test`;
// Generate a unique 10-digit suffix phone in +234 format (Nigerian)
const ONBOARDING_PHONE = `+234${String(_RUN_ID).slice(-10).padStart(10, "0")}`;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let _counter = 1;
const nextNum = () => String(_counter++).padStart(2, "0");

async function shot(page, slug) {
  const filename = `${nextNum()}-${slug}.png`;
  await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: true });
  console.log(`  ✓ ${filename}`);
}

async function goto(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
  await wait(600);
}

async function login(page, role) {
  const { email, password } = CREDS[role];
  await goto(page, "/sign-in");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  await wait(1000);
  console.log(`  → signed in as ${role}`);
}

/** SearchableSelect: click trigger, type search text, click first matching option */
async function selectSearchable(page, buttonText, searchText) {
  // Find the div that contains the placeholder/button text and click it
  const trigger = page.locator(`div:has-text("${buttonText}")`).filter({ hasText: buttonText }).first();
  await trigger.click();
  await wait(300);
  // Type in the search input that appears
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill(searchText);
    await wait(200);
  }
  // Click the first option in the dropdown
  const option = page.locator(`[role="option"], li`).filter({ hasText: searchText }).first();
  if (await option.isVisible()) {
    await option.click();
  } else {
    // Fallback: press Escape to close
    await page.keyboard.press("Escape");
  }
  await wait(200);
}

/** shadcn Select: click trigger, click the item with matching text */
async function selectShadcn(page, placeholder, optionText) {
  const trigger = page.locator(`[role="combobox"]`).filter({ hasText: placeholder }).first();
  if (!await trigger.isVisible()) return;
  await trigger.click();
  await wait(300);
  const item = page.locator(`[role="option"]`).filter({ hasText: optionText }).first();
  if (await item.isVisible()) await item.click();
  await wait(200);
}

// ─────────────────────────────────────────────────────────────────────────────

async function screenshotPublicPages(page) {
  console.log("\n── Public marketing pages ──");
  const routes = [
    ["/", "homepage"],
    ["/for-artisans", "for-artisans"],
    ["/for-homeowners", "for-homeowners"],
    ["/how-it-works", "how-it-works"],
    ["/trust", "trust"],
  ];
  for (const [route, slug] of routes) {
    await goto(page, route);
    await shot(page, slug);
  }
}

async function screenshotAuthPages(page) {
  console.log("\n── Auth pages ──");
  await goto(page, "/sign-in");
  await shot(page, "sign-in");

  await goto(page, "/sign-up");
  await shot(page, "sign-up");

  await goto(page, "/forgot-password");
  await shot(page, "forgot-password");

  // Reset password page (shows form even without a valid token)
  await goto(page, "/reset-password?token=placeholder");
  await shot(page, "reset-password");
}

async function screenshotOnboarding(page) {
  console.log("\n── Artisan onboarding (all 8 steps) ──");

  // Entry page (marketing for artisans)
  await goto(page, "/join-artisan");
  await shot(page, "onboarding-entry");

  // ── Step 1: screenshot empty form ──
  await goto(page, "/join-artisan/steps/1");
  await page.fill("#firstName", "Test");
  await page.fill("#lastName", "Screenshotter");
  await page.fill("#email", ONBOARDING_EMAIL);
  await page.fill("#phone", ONBOARDING_PHONE);
  await page.fill("#password", "Password123!");
  await shot(page, "onboarding-step-1-basic-info");

  // Create artisan account via API directly (avoids racing localStorage after signIn redirect)
  const regResult = await page.evaluate(async ({ email, phone }) => {
    try {
      const res = await fetch("/api/artisans/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "Screenshotter",
          email,
          phone,
          password: "Password123!",
        }),
      });
      if (!res.ok) return { error: await res.text() };
      return await res.json();
    } catch (e) {
      return { error: String(e) };
    }
  }, { email: ONBOARDING_EMAIL, phone: ONBOARDING_PHONE });

  if (!regResult?.artisanId) {
    console.warn("  ✗ Registration failed:", regResult?.error ?? "unknown — skipping steps 2-8");
    return;
  }
  const artisanId = regResult.artisanId;
  console.log(`  → artisanId: ${artisanId}`);

  // Sign in to get a session (needed for the PATCH API calls)
  await page.fill("#email", ONBOARDING_EMAIL);
  await page.fill("#password", "Password123!");
  await goto(page, "/sign-in");
  await page.fill("#email", ONBOARDING_EMAIL);
  await page.fill("#password", "Password123!");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  await wait(800);

  // Navigate to step 2 and screenshot
  await goto(page, "/join-artisan/steps/2");
  await shot(page, "onboarding-step-2-professional");

  // Helper: advance a step via API (authenticated session is active)
  const advance = async (step, data, credentials) => {
    const body = { step };
    if (data) body.data = data;
    if (credentials) body.credentials = credentials;
    const resp = await page.evaluate(
      async ({ artisanId, body }) => {
        const r = await fetch(`/api/artisans/onboarding/${artisanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        return r.status;
      },
      { artisanId, body },
    );
    if (resp !== 200) console.warn(`  ✗ step ${step} API returned ${resp}`);
  };

  // ── Step 3: Location ──
  await advance(2, {
    primarySkill: "ELECTRICIAN",
    experienceLevel: "3-5",
    bio: "Test artisan for screenshot purposes.",
    serviceRadiusKm: 15,
  });
  await goto(page, "/join-artisan/steps/3");
  await shot(page, "onboarding-step-3-location");

  // ── Step 4: ID Verification ──
  await advance(3, {
    country: "Nigeria",
    countryCode: "NG",
    state: "Lagos",
    city: "Lekki",
    lga: "Eti-Osa",
    residentialAddress: "12 Admiralty Way, Lekki Phase 1",
  });
  await goto(page, "/join-artisan/steps/4");
  await shot(page, "onboarding-step-4-id-verification");

  // ── Step 5: Proof of address ──
  await advance(4, undefined, [{ type: "NIN", fileUrl: "https://placehold.co/400x300" }]);
  await goto(page, "/join-artisan/steps/5");
  await shot(page, "onboarding-step-5-proof-of-address");

  // ── Step 6: Professional credentials ──
  await advance(5, undefined, [
    { type: "UTILITY_BILL", fileUrl: "https://placehold.co/400x300" },
  ]);
  await goto(page, "/join-artisan/steps/6");
  await shot(page, "onboarding-step-6-credentials");

  // ── Step 7: Portfolio ──
  await advance(6, undefined, undefined);
  await goto(page, "/join-artisan/steps/7");
  await shot(page, "onboarding-step-7-portfolio");

  // ── Step 8: Availability (final step) ──
  await advance(7, { items: [] });
  await goto(page, "/join-artisan/steps/8");
  await shot(page, "onboarding-step-8-availability");

  // ── Submitted page ──
  await goto(page, "/join-artisan/submitted");
  await shot(page, "onboarding-submitted");
}

async function screenshotHomeowner(page) {
  console.log("\n── Homeowner authenticated pages ──");
  await login(page, "homeowner");

  const routes = [
    ["/homeowner/dashboard", "homeowner-dashboard"],
    ["/homeowner/account", "homeowner-account"],
    ["/homeowner/requests/new", "homeowner-new-request"],
    ["/homeowner/history", "homeowner-history"],
    ["/homeowner/messages", "homeowner-messages"],
  ];
  for (const [route, slug] of routes) {
    await goto(page, route);
    await shot(page, slug);
  }

  // Job detail — pick the first job link on the dashboard if any
  await goto(page, "/homeowner/dashboard");
  const jobLink = await page.$('a[href^="/homeowner/jobs/"]');
  if (jobLink) {
    const href = await jobLink.getAttribute("href");
    await goto(page, href);
    await shot(page, "homeowner-job-detail");
  }
}

async function screenshotArtisan(page) {
  console.log("\n── Artisan authenticated pages ──");
  await login(page, "artisan");

  const routes = [
    ["/artisan/dashboard", "artisan-dashboard"],
    ["/artisan/account", "artisan-account"],
    ["/artisan/jobs", "artisan-jobs-list"],
    ["/artisan/history", "artisan-history"],
    ["/artisan/messages", "artisan-messages"],
    ["/artisan/profile/edit", "artisan-profile-edit"],
  ];
  for (const [route, slug] of routes) {
    await goto(page, route);
    await shot(page, slug);
  }

  // Job detail — pick the first job/match link from the jobs list
  await goto(page, "/artisan/jobs");
  const jobLink = await page.$('a[href^="/artisan/jobs/"]');
  if (jobLink) {
    const href = await jobLink.getAttribute("href");
    await goto(page, href);
    await shot(page, "artisan-job-detail");
  }
}

async function screenshotAdmin(page, context) {
  console.log("\n── Admin authenticated pages ──");
  await login(page, "admin");

  const routes = [
    ["/admin/console", "admin-console"],
    ["/admin/artisans", "admin-artisans-list"],
    ["/admin/homeowners", "admin-homeowners-list"],
    ["/admin/verifications", "admin-verifications"],
    ["/admin/history", "admin-history"],
    ["/admin/reports", "admin-reports"],
    ["/admin/settings", "admin-settings"],
    ["/admin/account", "admin-account"],
  ];
  for (const [route, slug] of routes) {
    await goto(page, route);
    await shot(page, slug);
  }

  // Artisan detail page — pick any artisan from admin list for the detail screenshot
  await goto(page, "/admin/artisans");
  const artisanDetailLink = await page.$('a[href^="/admin/artisans/"]');
  if (artisanDetailLink) {
    const href = await artisanDetailLink.getAttribute("href");
    await goto(page, href);
    await shot(page, "admin-artisan-detail");
  }

  // For the public profile, use the admin artisans API (we're still signed in as admin)
  // to find the first ACTIVE artisan — /api/artisans excludes artisans without GPS coords
  const activeId = await page.evaluate(async () => {
    const res = await fetch("/api/admin/artisans");
    const data = await res.json();
    const active = Array.isArray(data) ? data.find((a) => a.onboardingStatus === "ACTIVE") : null;
    return active?.id ?? null;
  });
  return activeId;
}

async function screenshotPublicArtisanProfile(page, artisanId) {
  if (!artisanId) return;
  console.log("\n── Public artisan profile ──");
  await goto(page, `/artisans/${artisanId}`);
  await shot(page, "public-artisan-profile");
}

/**
 * Sets up realistic seed state and captures the matching / AI ranking screen.
 *
 * What this does (must run BEFORE screenshotHomeowner / screenshotArtisan so
 * the messages pages are populated when those sections screenshot them):
 *
 *  A. Fetches seed profile IDs (emeka artisanId, folake homeownerId) via admin API.
 *  B. Creates a conversation between emeka and folake, sends a realistic exchange.
 *  C. As homeowner (folake): posts a SOLAR_TECHNICIAN request at Ayobo so the
 *     AI ranking panel can show the 2 Ayobo solar artisans.
 *  D. Screenshots matching screen in "AI searching" state (no offers).
 *  E. As artisan (emeka): submits an offer on that request.
 *  F. Back as homeowner: screenshots matching screen with offer card + AI score.
 */
async function screenshotMatchingFlow(page, context) {
  console.log("\n── Matching / AI ranking flow ──");

  // ── A. Fetch profile IDs while signed in as admin ──
  await login(page, "admin");
  // Explicit navigation ensures session cookie is fully committed before evaluate
  await goto(page, "/admin/console");
  const profileIds = await page.evaluate(async () => {
    try {
      const [artisansData, homeownersData] = await Promise.all([
        fetch("/api/admin/artisans").then((r) => r.json()),
        fetch("/api/admin/homeowners").then((r) => r.json()),
      ]);
      // Find by email first, fall back to first ACTIVE artisan / first homeowner
      const emeka = Array.isArray(artisansData)
        ? (artisansData.find((a) => a.user?.email === "emeka@veyro.test") ??
           artisansData.find((a) => a.onboardingStatus === "ACTIVE"))
        : null;
      const folake = Array.isArray(homeownersData)
        ? (homeownersData.find((h) => h.user?.email === "folake@veyro.test") ??
           homeownersData[0])
        : null;
      return {
        emekaArtisanId: emeka?.id ?? null,
        folakeHomeownerId: folake?.id ?? null,
        artisansCount: Array.isArray(artisansData) ? artisansData.length : `error: ${JSON.stringify(artisansData)}`,
        homeownersCount: Array.isArray(homeownersData) ? homeownersData.length : `error: ${JSON.stringify(homeownersData)}`,
      };
    } catch (e) {
      return { error: String(e) };
    }
  });

  console.log(`  → artisans in DB: ${profileIds.artisansCount}, homeowners: ${profileIds.homeownersCount}`);

  if (!profileIds.emekaArtisanId || !profileIds.folakeHomeownerId) {
    console.warn("  ✗ Could not resolve seed profile IDs:", profileIds);
  } else {
    console.log(`  → emekaArtisanId: ${profileIds.emekaArtisanId}`);
    console.log(`  → folakeHomeownerId: ${profileIds.folakeHomeownerId}`);

    // ── B. Set up a conversation with messages ──
    await context.clearCookies();
    await login(page, "artisan"); // POST /api/conversations requires artisan session
    await goto(page, "/artisan/dashboard");

    const convResult = await page.evaluate(async ({ homeownerId }) => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ homeownerId }),
        });
        if (!res.ok) return { error: await res.text() };
        return await res.json();
      } catch (e) {
        return { error: String(e) };
      }
    }, { homeownerId: profileIds.folakeHomeownerId });

    if (!convResult?.conversationId) {
      console.warn("  ✗ Conversation creation failed:", convResult?.error);
    } else {
      const convId = convResult.conversationId;
      console.log(`  → conversationId: ${convId}`);

      const sendMsg = (senderId, content) =>
        page.evaluate(
          async ({ convId, senderId, content }) => {
            await fetch(`/api/conversations/${convId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ senderId, type: "TEXT", content }),
            });
          },
          { convId, senderId, content },
        );

      await sendMsg(profileIds.emekaArtisanId, "Hi! I saw your solar panel request at Ayobo. I'm a certified solar technician with 6 years experience. I can handle 5kVA and above installations.");
      await sendMsg(profileIds.folakeHomeownerId, "Oh great! Yes, I need at least a 5kVA system. What brands do you work with?");
      await sendMsg(profileIds.emekaArtisanId, "I work with Luminous, Felicity, and Felicity. I can also source Victron inverters if you prefer. Full installation, wiring, and battery bank setup included.");
      await sendMsg(profileIds.folakeHomeownerId, "Sounds good. Can you come by for a site visit first? I'm free this weekend.");
      await sendMsg(profileIds.emekaArtisanId, "Saturday works for me. I'll bring my load assessment sheet so we can size the system properly. What time suits you?");
      await sendMsg(profileIds.folakeHomeownerId, "10am works. Looking forward to it!");
      console.log("  → messages sent");
    }
  }

  // ── C. As homeowner, post a SOLAR_TECHNICIAN request at Ayobo ──
  await context.clearCookies();
  await login(page, "homeowner");
  // Explicit navigation to bake in the session cookie before the API evaluate
  await goto(page, "/homeowner/dashboard");

  const srResult = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "SOLAR_TECHNICIAN",
          description: "Need solar panel installation for a 3-bedroom house. Looking for at least a 5kVA system with battery backup. Currently using NEPA only.",
          streetAddress: "15 Ayobo Road",
          lga: "Ayobo-Ipaja",
          state: "Lagos",
          country: "Nigeria",
          countryCode: "NG",
          budgetMin: 200000,
          budgetMax: 500000,
        }),
      });
      if (!res.ok) return { error: await res.text() };
      return await res.json();
    } catch (e) {
      return { error: String(e) };
    }
  });

  if (!srResult?.serviceRequestId) {
    console.warn("  ✗ Service request creation failed:", srResult?.error ?? "unknown — skipping matching screenshots");
    return;
  }
  const serviceRequestId = srResult.serviceRequestId;
  console.log(`  → serviceRequestId: ${serviceRequestId}`);

  // ── D. Screenshot matching screen — AI searching, no offers yet ──
  await goto(page, `/homeowner/requests/${serviceRequestId}/matching`);
  await wait(8000); // real Claude call for AI ranking — allow up to ~8s
  await shot(page, "matching-ai-searching");

  // ── E. Artisan submits an offer ──
  await context.clearCookies();
  await login(page, "artisan");
  await goto(page, "/artisan/dashboard");

  const offerResult = await page.evaluate(async ({ serviceRequestId }) => {
    try {
      const res = await fetch(`/api/service-requests/${serviceRequestId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedPrice: 320000,
          etaMinutes: 120,
          distanceKm: 4.5,
        }),
      });
      if (!res.ok) return { error: await res.text() };
      return await res.json();
    } catch (e) {
      return { error: String(e) };
    }
  }, { serviceRequestId });

  if (!offerResult?.matchId) {
    console.warn("  ✗ Offer submission failed:", offerResult?.error ?? "unknown");
  } else {
    console.log(`  → matchId: ${offerResult.matchId}`);
  }

  // ── F. Back as homeowner — screenshot with offer card + AI score ──
  await context.clearCookies();
  await login(page, "homeowner");
  await goto(page, "/homeowner/dashboard");

  await goto(page, `/homeowner/requests/${serviceRequestId}/matching`);
  await wait(3000); // AI result is cached now — fast
  await shot(page, "matching-with-offer-ai-score");
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Saving screenshots to ${OUT_DIR}`);
  console.log(`Connecting to ${BASE_URL} ...\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    // One persistent context so session cookies survive across gotos
    const context = await browser.newContext({
      viewport: VIEWPORT,
      // Ignore HTTPS errors in case the dev cert isn't trusted
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    // Quick health check — fail fast if server isn't up
    try {
      await page.goto(BASE_URL, { timeout: 10000, waitUntil: "domcontentloaded" });
    } catch {
      console.error(
        `✗  Cannot reach ${BASE_URL}.\n   Make sure the dev server is running:\n   cd apps/web && npx next dev`,
      );
      process.exit(1);
    }

    await screenshotPublicPages(page);
    await screenshotAuthPages(page);
    await screenshotOnboarding(page);

    // Run matching flow first — seeds conversations and messages so that the
    // homeowner and artisan messages pages are populated when screenshotted below.
    await context.clearCookies();
    await screenshotMatchingFlow(page, context);

    await context.clearCookies();
    await screenshotHomeowner(page);

    await context.clearCookies();
    await screenshotArtisan(page);

    await context.clearCookies();
    const artisanId = await screenshotAdmin(page, context);

    await context.clearCookies();
    await screenshotPublicArtisanProfile(page, artisanId);

    await context.close();
  } finally {
    await browser.close();
  }

  // Count files
  const files = execSync(`ls "${OUT_DIR}" | wc -l`).toString().trim();
  console.log(`\n✓ ${files} screenshots captured`);

  // Zip
  const zipPath = path.join(__dirname, "screenshots.zip");
  execSync(`cd "${__dirname}" && zip -r screenshots.zip screenshots/`);
  console.log(`✓ Zipped → ${zipPath}`);
}

main().catch((err) => {
  console.error("\n✗ Script failed:", err.message);
  process.exit(1);
});
