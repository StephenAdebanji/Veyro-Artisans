import { redirect } from "next/navigation";
import { DashboardNavbar } from "@/components/shared/dashboard-navbar";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";

export default async function HomeownerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const profile = await userService.getHomeownerProfileByUserId(userId);
  const firstName = profile?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardNavbar role="homeowner" userName={firstName} profilePhotoUrl={profile?.profilePhotoUrl} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
