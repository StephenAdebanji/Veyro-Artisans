import { redirect } from "next/navigation";
import { DashboardNavbar } from "@/components/shared/dashboard-navbar";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";

export default async function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const profile = await userService.getArtisanProfileByUserId(userId);
  const firstName = profile?.firstName ?? "Artisan";

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNavbar role="artisan" userName={firstName} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
