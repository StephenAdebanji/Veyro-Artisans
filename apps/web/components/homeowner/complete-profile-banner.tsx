import Link from "next/link";
import { MapPin } from "lucide-react";

/** Not dismissible — stays on the dashboard until the homeowner fills in
 * address/state on the account page, since that's the only place location
 * is now collected (sign-up was kept deliberately lean). */
export function CompleteProfileBanner() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Complete your account setup</p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
            Add your state and address so artisans can find and reach you.
          </p>
        </div>
      </div>
      <Link
        href="/homeowner/account"
        className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
      >
        Complete profile
      </Link>
    </div>
  );
}
