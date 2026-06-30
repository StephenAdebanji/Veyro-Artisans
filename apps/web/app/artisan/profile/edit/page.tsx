import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { EditProfileForm } from "@/components/artisan/edit-profile-form";

export default async function ArtisanProfileEditPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const ref = await userService.getArtisanProfileByUserId(userId);
  if (!ref) redirect("/sign-in");

  const profile = (await userService.getArtisanProfile(ref.id, { includePrivate: true })) as Record<
    string,
    unknown
  > | null;
  if (!profile) redirect("/sign-in");

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your personal details, rates and availability.
      </p>
      <div className="mt-6 max-w-2xl">
        <EditProfileForm
          artisanId={ref.id}
          initialData={{
            firstName: (profile.firstName as string | null) ?? "",
            lastName: (profile.lastName as string | null) ?? "",
            bio: (profile.bio as string | null) ?? "",
            hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : undefined,
            serviceRadiusKm: profile.serviceRadiusKm ? Number(profile.serviceRadiusKm) : undefined,
            city: (profile.city as string | null) ?? "",
            state: (profile.state as string | null) ?? "",
          }}
        />
      </div>
    </main>
  );
}
