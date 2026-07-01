import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Phone, User } from "lucide-react";
import { auth } from "@/platform/auth-session";
import { prisma } from "@/platform/prisma";
import { matchingService } from "@/services/matching/matching.service";
import { userService } from "@/services/user/user.service";
import { Badge } from "@/components/ui/badge";
import { SKILL_LABELS } from "@/components/shared/skill-labels";
import type { SkillCategory } from "@veyro/contracts";
import { CallButton } from "@/components/artisan/call-button";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DISPUTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const artisan = await prisma.artisanProfile.findUnique({ where: { userId } });
  if (!artisan || artisan.verificationStatus !== "VERIFIED") redirect("/artisan/jobs");

  const job = await matchingService.getJobFeedItem(jobId, artisan.id);
  if (!job) notFound();

  const homeowner = await userService.getHomeownerProfile(job.homeownerId);
  if (!homeowner) notFound();

  return (
    <main className="mx-auto max-w-xl flex-1 px-6 py-10">
      {/* Back */}
      <Link
        href="/artisan/jobs"
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* Job summary */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs text-muted-foreground">
              {SKILL_LABELS[job.category as SkillCategory] ?? job.category}
            </span>
            <h1 className="mt-1 text-lg font-semibold">{job.description}</h1>
          </div>
          <Badge className={STATUS_STYLE[job.status] ?? ""}>
            {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
          </Badge>
        </div>
        <p className="mt-3 text-xl font-bold">₦{job.price.toLocaleString()}</p>
      </div>

      {/* Customer card */}
      <div className="mt-5 rounded-2xl border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Customer
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold">{homeowner.fullName ?? "Homeowner"}</p>
            <p className="text-sm text-muted-foreground">Verified homeowner</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {job.conversationId ? (
            <Link
              href={`/artisan/messages?c=${job.conversationId}`}
              className="flex items-center justify-center gap-2 rounded-xl border bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Link>
          ) : (
            <span
              title="Chat opens once the homeowner accepts your offer"
              className="flex items-center justify-center gap-2 rounded-xl border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              Chat unavailable
            </span>
          )}

          <CallButton phone={homeowner.phone} />
        </div>
      </div>
    </main>
  );
}
