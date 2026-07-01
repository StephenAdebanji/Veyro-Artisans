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
  disabled?: boolean;
  isTopRecommendation?: boolean;
}

export function OfferCard({ offer, onAccept, disabled, isTopRecommendation }: OfferCardProps) {
  const [accepting, setAccepting] = useState(false);

  const initials = offer.artisanName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleAccept() {
    setAccepting(true);
    try {
      await onAccept(offer.matchId);
    } finally {
      setAccepting(false);
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
            <Button
              size="default"
              className="mt-2"
              onClick={handleAccept}
              disabled={disabled || accepting}
            >
              {accepting ? "Accepting…" : "Accept"}
            </Button>
          ) : (
            <Badge
              variant={offer.status === "ACCEPTED" ? "default" : "secondary"}
              className="mt-2"
            >
              {offer.status === "ACCEPTED" ? "Accepted" : offer.status.toLowerCase()}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
