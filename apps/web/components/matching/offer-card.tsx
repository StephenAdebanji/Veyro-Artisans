"use client";

import { useState } from "react";
import { Star, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface OfferData {
  matchId: string;
  artisanId: string;
  artisanName: string;
  ratingAvg: number;
  ratingCount: number;
  trustScore: number;
  proposedPrice: number;
  etaMinutes: number;
  distanceKm: number;
  status: string;
  aiScore?: number;
  aiReason?: string;
}

interface OfferCardProps {
  offer: OfferData;
  onAccept: (matchId: string) => Promise<void>;
  onReject?: (matchId: string, reason: string) => Promise<void>;
  disabled?: boolean;
  isTopRecommendation?: boolean;
}

export function OfferCard({ offer, onAccept, onReject, disabled, isTopRecommendation }: OfferCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const initials = offer.artisanName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleAccept() {
    setAccepting(true);
    setAcceptError(null);
    try {
      await onAccept(offer.matchId);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Failed to accept offer. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a reason for rejecting this offer.");
      return;
    }
    setRejecting(true);
    setRejectError(null);
    try {
      await onReject?.(offer.matchId, rejectReason.trim());
      setShowRejectForm(false);
      setRejectReason("");
    } catch {
      setRejectError("Failed to reject offer. Please try again.");
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md ${
        isTopRecommendation ? "border-primary/40 ring-2 ring-primary/20" : ""
      }`}
    >
      {isTopRecommendation && (
        <div className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          VEYRO Recommends
        </div>
      )}

      <div className="flex items-start gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
          {initials || "?"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold">{offer.artisanName}</span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(offer.trustScore)}/100 Trust
            </Badge>
            {offer.aiScore !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                <Sparkles className="h-3 w-3" />
                AI {offer.aiScore}%
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {offer.ratingAvg.toFixed(1)} ({offer.ratingCount})
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {offer.etaMinutes} min ETA
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {offer.distanceKm.toFixed(1)} km away
            </span>
          </div>

          {offer.aiReason && (
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
              {offer.aiReason}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-bold">₦{offer.proposedPrice.toLocaleString()}</p>
          {offer.status === "PENDING" ? (
            <div className="mt-2 flex flex-col gap-1.5">
              <Button
                size="default"
                onClick={handleAccept}
                disabled={disabled || accepting || showRejectForm}
              >
                {accepting ? "Accepting…" : "Accept"}
              </Button>
              {onReject && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => { setShowRejectForm((v) => !v); setRejectError(null); }}
                  disabled={disabled || accepting}
                >
                  Reject
                </Button>
              )}
              {acceptError && <p className="text-xs text-destructive">{acceptError}</p>}
            </div>
          ) : (
            <Badge
              variant={offer.status === "ACCEPTED" ? "default" : "secondary"}
              className="mt-2"
            >
              {offer.status === "ACCEPTED" ? "Accepted" : offer.status === "DECLINED" ? "Declined" : offer.status.toLowerCase()}
            </Badge>
          )}
        </div>
      </div>

      {showRejectForm && offer.status === "PENDING" && (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="mb-2 text-sm font-medium">Why are you rejecting this offer?</p>
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/30"
            rows={3}
            placeholder="e.g. Price is too high, I need someone sooner…"
            value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(null); }}
          />
          {rejectError && <p className="mt-1 text-xs text-destructive">{rejectError}</p>}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? "Rejecting…" : "Confirm reject"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowRejectForm(false); setRejectReason(""); setRejectError(null); }}
              disabled={rejecting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
