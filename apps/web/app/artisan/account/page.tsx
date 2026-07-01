import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userService } from "@/services/user/user.service";
import { prisma } from "@/platform/prisma";
import { ArtisanAccount } from "@/components/artisan/artisan-account";

export default async function ArtisanAccountPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/sign-in");

  const ref = await userService.getArtisanProfileByUserId(userId);
  if (!ref) redirect("/sign-in");

  const [profile, user, credentials] = await Promise.all([
    userService.getArtisanProfile(ref.id, { includePrivate: true }) as Promise<Record<string, unknown> | null>,
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.credential.findMany({
      where: { artisanId: ref.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!profile || !user) redirect("/sign-in");

  return (
    <ArtisanAccount
      artisanId={ref.id}
      email={user.email}
      verificationStatus={
        ((profile.verificationStatus as string | undefined) ?? "UNVERIFIED") as
          | "UNVERIFIED"
          | "VERIFIED"
          | "REJECTED"
      }
      profilePhotoUrl={(profile.profilePhotoUrl as string | null | undefined) ?? null}
      initialData={{
        firstName: (profile.firstName as string | null) ?? "",
        lastName: (profile.lastName as string | null) ?? "",
        bio: (profile.bio as string | null) ?? "",
        serviceRadiusKm: profile.serviceRadiusKm ? Number(profile.serviceRadiusKm) : undefined,
        city: (profile.city as string | null) ?? "",
        state: (profile.state as string | null) ?? "",
      }}
      credentials={credentials.map((c) => ({
        id: c.id,
        type: c.type,
        fileUrl: c.fileUrl,
        status: c.status as "PENDING" | "APPROVED" | "REJECTED",
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
