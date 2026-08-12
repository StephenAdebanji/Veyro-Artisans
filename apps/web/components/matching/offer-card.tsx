"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Clock, MapPin, Sparkles, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SkillCategory } from "@veyro/contracts";

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
  profilePhotoUrl?: string | null;
  city?: string | null;
  state?: string | null;
  aiScore?: number;
  aiReason?: string;
  /** True when this artisan's identity verification has a CONFIRMED
   * BlockchainRecord — i.e. the trust score behind the badge below isn't
   * just a self-reported number, it's backed by a tamper-evident on-chain
   * record. See BlockchainRecordType.IDENTITY_VERIFIED. */
  blockchainVerified?: boolean;
}

// Best-effort visual fallback when an artisan hasn't uploaded a profile
// photo — a trade-specific emoji reads better than blank initials.
const SKILL_EMOJI: Partial<Record<SkillCategory, string>> = {
  ELECTRICIAN: "⚡",
  PLUMBER: "🔧",
  CARPENTER: "🪚",
  PAINTER: "🎨",
  WELDER: "🔥",
  AC_TECHNICIAN: "❄️",
  GENERATOR_TECHNICIAN: "⚙️",
  SOLAR_TECHNICIAN: "☀️",
  CCTV_INSTALLER: "📷",
  AUTO_MECHANIC: "🚗",
  TILER: "🧱",
  FURNITURE_MAKER: "🪑",
  INTERIOR_DECORATOR: "🖼️",
  CLEANER: "🧹",
  PHONE_REPAIR_TECHNICIAN: "📱",
  COMPUTER_TECHNICIAN: "💻",
  REFRIGERATOR_TECHNICIAN: "🧊",
  BARBER: "💈",
  HAIR_STYLIST: "💇",
  MAKEUP_ARTIST: "💄",
  TAILOR: "🧵",
  PHOTOGRAPHER: "📸",
  CATERER: "🍽️",
  BAKER: "🍞",
  LOCKSMITH: "🔑",
};
const DEFAULT_EMOJI = "🛠️";

interface OfferCardProps {
  offer: OfferData;
  /** Every offer on a request is for the same category — used only for the
   * emoji fallback when the artisan has no profile photo. */
  category: SkillCategory;
  onAccept: (matchId: string) => Promise<void>;
  onReject?: (matchId: string, reason: string) => Promise<void>;
  disabled?: boolean;
  isTopRecommendation?: boolean;
  /** Only populated for the accepted offer — enables the Call button. */
  artisanPhone?: string | null;
  /** Only called for the accepted offer — starts/opens the chat with this artisan. */
  onChat?: () => void;
  chatPending?: boolean;
  chatError?: string | null;
}

export function OfferCard({
  offer,
  category,
  onAccept,
  onReject,
  disabled,
  isTopRecommendation,
  artisanPhone,
  onChat,
  chatPending,
  chatError,
}: OfferCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const location = [offer.city, offer.state].filter(Boolean).join(", ");

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
        {offer.profilePhotoUrl ? (
          <Image
            src={offer.profilePhotoUrl}
            alt={offer.artisanName}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
            {SKILL_EMOJI[category] ?? DEFAULT_EMOJI}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold">{offer.artisanName}</span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(offer.trustScore)}/100 Trust
            </Badge>
            {offer.blockchainVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-900">
                <ShieldCheck className="h-2.5 w-2.5" />
                Verified on-chain
              </span>
            )}
            {offer.aiScore !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                <Sparkles className="h-3 w-3" />
                AI {offer.aiScore}%
              </span>
            )}
            {offer.status === "ACCEPTED" && (
              <div className="ml-auto flex items-center gap-2">
                {onChat && (
                  <Button size="sm" variant="outline" onClick={onChat} disabled={chatPending}>
                    <MessageCircle className="h-3.5 w-3.5" /> {chatPending ? "Opening…" : "Chat"}
                  </Button>
                )}
                {artisanPhone && (
                  <a href={`tel:${artisanPhone}`}>
                    <Button size="sm" variant="outline">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
          {chatError && <p className="mt-1 text-xs text-destructive">{chatError}</p>}
          <p className="mt-0.5 text-xs text-muted-foreground">
            Trust score based on verified identity, credentials, ratings, reviews, completion rate and response time.
          </p>

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
              {location ? `${location} · ` : ""}
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
