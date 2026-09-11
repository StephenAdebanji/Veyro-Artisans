"use client";

import { useEffect, useRef } from "react";

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

function FactorBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
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

  const ringColor =
    score >= 75 ? "#7c3aed" : score >= 50 ? "#f59e0b" : "#ef4444";

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

      {/* Ring */}
      <div className="flex justify-center">
        <div className="relative inline-flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            {/* Background track */}
            <circle
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted"
            />
            {/* Progress arc */}
            <circle
              ref={circleRef}
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold leading-none" style={{ color: ringColor }}>
              {Math.round(score)}
            </span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="mt-4 space-y-2.5">
        <FactorBar label="Identity" value={isVerified ? 1 : 0} color="bg-violet-500" />
        <FactorBar label="Rating" value={ratingFactor} color="bg-amber-500" />
        <FactorBar label="Completion" value={completionFactor} color="bg-emerald-500" />
        <FactorBar label="Response time" value={responseFactor} color="bg-blue-500" />
      </div>
    </div>
  );
}
