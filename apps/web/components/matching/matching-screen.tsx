"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { OfferCard, type OfferData } from "./offer-card";
import type { RankedArtisan, SkillCategory } from "@veyro/contracts";
import { SKILL_LABELS } from "@/components/shared/skill-labels";

const MATCH_WINDOW_SECONDS = 10 * 60; // 10 minutes

interface MatchingScreenProps {
  serviceRequestId: string;
  category: SkillCategory;
  description: string;
  address: string;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
  initialOffers: OfferData[];
}

export function MatchingScreen({
  serviceRequestId,
  category,
  description,
  address,
  budgetMin,
  budgetMax,
  createdAt,
  initialOffers,
}: MatchingScreenProps) {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferData[]>(initialOffers);
  const [acceptedMatchId, setAcceptedMatchId] = useState<string | null>(
    initialOffers.find((o) => o.status === "ACCEPTED")?.matchId ?? null,
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    return Math.max(0, MATCH_WINDOW_SECONDS - elapsed);
  });
  const [aiCandidates, setAiCandidates] = useState<RankedArtisan[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);

  // Countdown tick.
  useEffect(() => {
    if (secondsLeft <= 0 || acceptedMatchId) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, acceptedMatchId]);

  // Fetch AI recommendation scores on mount.
  useEffect(() => {
    fetch(`/api/ai/recommendations?serviceRequestId=${serviceRequestId}`)
      .then((r) => r.json())
      .then((data: { ranked?: RankedArtisan[] }) => {
        if (data.ranked) setAiCandidates(data.ranked);
      })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [serviceRequestId]);

  // Connect to Socket.io /matching namespace.
  useEffect(() => {
    let mounted = true;

    async function connect() {
      const res = await fetch("/api/realtime-token");
      if (!res.ok || !mounted) return;
      const { token } = (await res.json()) as { token: string };
      if (!mounted) return;

      const { io } = await import("socket.io-client");
      const socket = io(
        `${process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001"}/matching`,
        { auth: { token }, transports: ["websocket"] },
      );
      socketRef.current = socket;

      socket.emit("join-request", { serviceRequestId });

      socket.on("offer-created", (offer: OfferData) => {
        if (!mounted) return;
        setOffers((prev) => {
          const exists = prev.some((o) => o.matchId === offer.matchId);
          if (exists) return prev;
          // Attach AI score from already-fetched candidates list.
          setAiCandidates((candidates) => {
            const ai = candidates.find((c) => c.artisanId === offer.artisanId);
            if (ai) {
              offer.aiScore = ai.semanticScore;
              offer.aiReason = ai.semanticReason;
            }
            return candidates;
          });
          return [offer, ...prev];
        });
      });

      socket.on("offer-responded", ({ matchId, decision, jobId: jid }: { matchId: string; decision: string; jobId: string | null }) => {
        if (!mounted) return;
        if (decision === "ACCEPT") {
          setAcceptedMatchId(matchId);
          setJobId(jid);
          setOffers((prev) =>
            prev.map((o) => ({
              ...o,
              status: o.matchId === matchId ? "ACCEPTED" : o.status === "PENDING" ? "EXPIRED" : o.status,
            })),
          );
        }
      });
    }

    connect().catch(console.error);
    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [serviceRequestId]);

  async function handleAccept(matchId: string) {
    const res = await fetch(`/api/matches/${matchId}/accept`, { method: "POST" });
    if (!res.ok) return;
    const { jobId: jid } = (await res.json()) as { jobId: string };
    setAcceptedMatchId(matchId);
    setJobId(jid);
    setOffers((prev) =>
      prev.map((o) => ({
        ...o,
        status: o.matchId === matchId ? "ACCEPTED" : o.status === "PENDING" ? "EXPIRED" : o.status,
      })),
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {SKILL_LABELS[category] ?? category}
            </span>
            <p className="mt-2 text-sm text-muted-foreground">{address}</p>
            <p className="mt-1 font-medium">{description}</p>
            {(budgetMin || budgetMax) && (
              <p className="mt-1 text-sm text-muted-foreground">
                Budget:{" "}
                {budgetMin && budgetMax
                  ? `₦${budgetMin.toLocaleString()} – ₦${budgetMax.toLocaleString()}`
                  : budgetMax
                  ? `up to ₦${budgetMax.toLocaleString()}`
                  : `from ₦${budgetMin!.toLocaleString()}`}
              </p>
            )}
          </div>

          {!acceptedMatchId && secondsLeft > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Offer window closes in</p>
              <p
                className={`text-2xl font-bold tabular-nums ${secondsLeft < 60 ? "text-destructive" : "text-primary"}`}
              >
                {mm}:{ss}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Accepted state */}
      {acceptedMatchId && (
        <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <div>
            <p className="text-lg font-semibold text-emerald-800">Artisan confirmed!</p>
            <p className="text-sm text-emerald-700">
              Your artisan is on the way. You can chat with them below.
            </p>
          </div>
          {jobId && (
            <button
              onClick={() => router.push("/homeowner/dashboard")}
              className="mt-1 text-sm font-medium text-emerald-700 underline underline-offset-2"
            >
              Back to dashboard →
            </button>
          )}
        </div>
      )}

      {/* Offers */}
      <div>
        {secondsLeft === 0 && !acceptedMatchId && offers.length === 0 ? (
          <div className="flex flex-col items-center gap-6 rounded-xl border bg-card py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              ⏱
            </div>
            <div>
              <h2 className="text-xl font-semibold">No artisans responded</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No one picked up your request within the offer window.
              </p>
            </div>
            <button
              onClick={() => router.push("/homeowner/requests/new")}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Post again
            </button>
          </div>
        ) : (
          <>
            {/* AI Selecting panel — shown while waiting for offers */}
            {offers.length === 0 && !acceptedMatchId && secondsLeft > 0 && (
              <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                    VEYRO AI is finding your best match
                  </span>
                  {aiLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />}
                </div>

                {!aiLoading && aiCandidates.length > 0 ? (
                  <div className="space-y-2.5">
                    {aiCandidates.slice(0, 3).map((c, idx) => (
                      <div key={c.artisanId} className="flex items-center gap-3">
                        <span className="w-4 text-xs font-bold text-violet-500">#{idx + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-violet-900 dark:text-violet-200">
                          {c.artisanName ?? "Artisan"}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-800">
                            <div
                              className="h-full rounded-full bg-violet-600 dark:bg-violet-400 transition-all duration-500"
                              style={{ width: `${c.semanticScore ?? Math.round(c.score * 100)}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs font-semibold text-violet-700 dark:text-violet-300">
                            {c.semanticScore ?? Math.round(c.score * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : aiLoading ? (
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    Analysing nearby artisans…
                  </p>
                ) : (
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    Notifying artisans in your area…
                  </p>
                )}
              </div>
            )}

            <h2 className="mb-3 text-lg font-semibold">
              {offers.length === 0
                ? "Waiting for artisans…"
                : `${offers.length} offer${offers.length === 1 ? "" : "s"} received`}
            </h2>

            {offers.length === 0 && !acceptedMatchId && (
              <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Nearby artisans are being notified. Offers appear here live.</p>
              </div>
            )}

            {offers.length > 0 && (() => {
              const aiMap = Object.fromEntries(aiCandidates.map((a) => [a.artisanId, a]));
              const sortedOffers = [...offers].sort(
                (a, b) => (aiMap[b.artisanId]?.score ?? 0) - (aiMap[a.artisanId]?.score ?? 0),
              );
              const topArtisanId = sortedOffers[0]?.artisanId;
              return (
                <div className="space-y-3">
                  {sortedOffers.map((offer) => {
                    const ai = aiMap[offer.artisanId];
                    return (
                      <OfferCard
                        key={offer.matchId}
                        offer={{
                          ...offer,
                          aiScore: ai?.semanticScore ?? offer.aiScore,
                          aiReason: ai?.semanticReason ?? offer.aiReason,
                        }}
                        onAccept={handleAccept}
                        disabled={!!acceptedMatchId}
                        isTopRecommendation={offer.artisanId === topArtisanId && !!ai}
                      />
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
