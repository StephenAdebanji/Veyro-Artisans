"use client";

import { useEffect, useRef, useState } from "react";

interface TrustScoreRingProps {
  score: number;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  totalJobsAccepted: number;
  responseTimeAvgSeconds: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

// Bar colors — four distinct hues that sit apart on the wheel but feel cohesive
// violet (identity/trust) · amber (star rating) · emerald (completion/success) · sky (response time/speed)
const BAR_COLORS = {
  identity: "bg-violet-500",
  rating: "bg-amber-500",
  completion: "bg-emerald-500",
  response: "bg-sky-500",
} as const;

// Ring arc: green (high) → teal (mid) → red (low)
function ringColor(score: number) {
  if (score >= 75) return "#10b981"; // emerald-500  — green
  if (score >= 50) return "#14b8a6"; // teal-500     — teal
  return "#ef4444";                  // red-500      — red
}

function scoreBand(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  return "Building";
}

function FactorBar({ label, value, color, weight }: { label: string; value: number; color: string; weight: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">
          {label}
          <span className="ml-1 text-[10px] opacity-50">{weight}</span>
        </span>
        <span className="font-semibold">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function TrustScoreRing({
  score,
  isVerified,
  ratingAvg,
  ratingCount,
  completedJobs,
  totalJobsAccepted,
  responseTimeAvgSeconds,
}: TrustScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    const offset = CIRCUMFERENCE * (1 - score / 100);
    circle.style.transition = "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)";
    circle.style.strokeDashoffset = String(offset);
  }, [score]);

  const ratingFactor = ratingCount >= 3 ? clamp(ratingAvg / 5) : 0.5;
  const completionFactor = totalJobsAccepted > 0 ? clamp(completedJobs / totalJobsAccepted) : 0;
  const responseFactor = responseTimeAvgSeconds > 0 ? clamp(120 / responseTimeAvgSeconds) : 0;
  const color = ringColor(score);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Trust Score</h3>
        {isVerified && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            Verified ✓
          </span>
        )}
      </div>

      {/* Ring with hover tooltip */}
      <div className="flex justify-center">
        <div
          className="relative inline-flex cursor-default items-center justify-center"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted"
            />
            <circle
              ref={circleRef}
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold leading-none" style={{ color }}>
              {Math.round(score)}
            </span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>

          {/* Hover tooltip */}
          {hovered && (
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg border bg-popover px-3.5 py-3 text-[11px] shadow-lg">
              <p className="font-semibold text-foreground">
                {scoreBand(score)} trust ({Math.round(score)}/100)
              </p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Homeowners see this score when deciding who to hire. A higher score means
                more completed jobs, verified identity, good reviews, and fast replies.
              </p>
              <div className="mt-2.5 space-y-1 border-t pt-2">
                <p className="font-medium text-foreground mb-1">How it's calculated</p>
                {[
                  ["Identity verification", "20%"],
                  ["Credential verification", "20%"],
                  ["Star rating", "25%"],
                  ["Review count", "15%"],
                  ["Completion rate", "10%"],
                  ["Response time", "10%"],
                ].map(([factor, weight]) => (
                  <div key={factor} className="flex justify-between text-muted-foreground">
                    <span>{factor}</span>
                    <span className="font-medium">{weight}</span>
                  </div>
                ))}
              </div>
              {/* Arrow */}
              <div className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r bg-popover" />
            </div>
          )}
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="mt-4 space-y-2.5">
        <FactorBar label="Identity" value={isVerified ? 1 : 0} color={BAR_COLORS.identity} weight="20%" />
        <FactorBar label="Rating" value={ratingFactor} color={BAR_COLORS.rating} weight="25%" />
        <FactorBar label="Completion" value={completionFactor} color={BAR_COLORS.completion} weight="10%" />
        <FactorBar label="Response time" value={responseFactor} color={BAR_COLORS.response} weight="10%" />
      </div>
    </div>
  );
}
