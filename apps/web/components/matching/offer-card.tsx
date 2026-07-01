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
      className={`rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm ${
        isTopRecommendation ? "border-primary/40 ring-1 ring-primary/20" : ""
      }`}
    >
      {isTopRecommendation && (
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          VEYRO Recommends
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials || "?"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{offer.artisanName}</span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(offer.trustScore)}/100 Trust
            </Badge>
            {offer.aiScore !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                <Sparkles className="h-3 w-3" />
                AI {offer.aiScore}%
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {offer.ratingAvg.toFixed(1)} ({offer.ratingCount})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {offer.etaMinutes} min ETA
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {offer.distanceKm.toFixed(1)} km away
            </span>
          </div>

          {offer.aiReason && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
              {offer.aiReason}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold">₦{offer.proposedPrice.toLocaleString()}</p>
          {offer.status === "PENDING" ? (
            <Button
              size="sm"
              className="mt-1.5"
              onClick={handleAccept}
              disabled={disabled || accepting}
            >
              {accepting ? "Accepting…" : "Accept"}
            </Button>
          ) : (
            <Badge
              variant={offer.status === "ACCEPTED" ? "default" : "secondary"}
              className="mt-1.5"
            >
              {offer.status === "ACCEPTED" ? "Accepted" : offer.status.toLowerCase()}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
