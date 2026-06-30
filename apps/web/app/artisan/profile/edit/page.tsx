import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { prisma } from "@/platform/prisma";
import { EditProfileForm } from "@/components/artisan/edit-profile-form";

export default async function ArtisanProfileEditPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const ref = await userService.getArtisanProfileByUserId(userId);
  if (!ref) redirect("/sign-in");

  const [profile, user] = await Promise.all([
    userService.getArtisanProfile(ref.id, { includePrivate: true }) as Promise<Record<
      string,
      unknown
    > | null>,
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  if (!profile || !user) redirect("/sign-in");

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>
        <div className="mt-8">
          <EditProfileForm
            artisanId={ref.id}
            email={user.email}
            initialData={{
              firstName: (profile.firstName as string | null) ?? "",
              lastName: (profile.lastName as string | null) ?? "",
              bio: (profile.bio as string | null) ?? "",
              serviceRadiusKm: profile.serviceRadiusKm ? Number(profile.serviceRadiusKm) : undefined,
              city: (profile.city as string | null) ?? "",
              state: (profile.state as string | null) ?? "",
            }}
          />
        </div>
      </div>
    </main>
  );
}
