"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/session";

export function IdleReasonBanner({ reason }: { reason?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (reason === "idle") {
      router.replace("/sign-in");
    }
  }, [reason, router]);

  if (reason !== "idle") return null;

  return (
    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      You were signed out after {IDLE_TIMEOUT_MINUTES} minutes of inactivity — please sign in again.
    </div>
  );
}
