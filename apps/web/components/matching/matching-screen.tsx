"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { OfferCard, type OfferData } from "./offer-card";
import type { SkillCategory } from "@veyro/contracts";
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
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);

  // Countdown tick.
  useEffect(() => {
    if (secondsLeft <= 0 || acceptedMatchId) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, acceptedMatchId]);

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
          return exists ? prev : [offer, ...prev];
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
            <h2 className="mb-3 text-lg font-semibold">
              {offers.length === 0
                ? "Waiting for artisans…"
                : `${offers.length} offer${offers.length === 1 ? "" : "s"} received`}
            </h2>

            {offers.length === 0 && !acceptedMatchId && (
              <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Nearby artisans are being notified. Offers appear here live.</p>
              </div>
            )}

            <div className="space-y-3">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.matchId}
                  offer={offer}
                  onAccept={handleAccept}
                  disabled={!!acceptedMatchId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
