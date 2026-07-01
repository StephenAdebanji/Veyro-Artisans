import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { prisma } from "@/platform/prisma";
import { HomeownerAccount } from "@/components/homeowner/homeowner-account";

export default async function HomeownerAccountPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const [homeowner, user] = await Promise.all([
    userService.getHomeownerProfileByUserId(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  if (!homeowner || !user) redirect("/sign-in");

  const profile = await prisma.homeownerProfile.findUnique({ where: { userId } });

  return (
    <HomeownerAccount
      email={user.email}
      fullName={homeowner.fullName ?? ""}
      profilePhotoUrl={profile?.profilePhotoUrl ?? null}
      initial={{
        phone: profile?.phone ?? "",
        address: profile?.address ?? "",
        city: profile?.city ?? "",
        state: profile?.state ?? "",
      }}
    />
  );
}
