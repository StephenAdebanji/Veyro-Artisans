import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { prisma } from "@/platform/prisma";
import { SettingsForm } from "@/components/homeowner/settings-form";

export default async function HomeownerSettingsPage() {
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
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>
        <div className="mt-8">
          <SettingsForm
            email={user.email}
            fullName={homeowner.fullName ?? ""}
            initial={{
              phone: profile?.phone ?? "",
              address: profile?.address ?? "",
              city: profile?.city ?? "",
              state: profile?.state ?? "",
            }}
          />
        </div>
      </div>
    </main>
  );
}
