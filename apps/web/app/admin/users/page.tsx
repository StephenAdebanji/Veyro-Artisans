import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { authRepository } from "@/services/auth/auth.repository";
import { userRepository } from "@/services/user/user.repository";
import { UsersTable, type CombinedUserRow } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const [admins, artisans, homeowners] = await Promise.all([
    authRepository.listByRole("ADMIN"),
    userRepository.listAllArtisans(),
    userRepository.listAllHomeowners(),
  ]);

  const withDates: { row: CombinedUserRow; createdAt: Date }[] = [
    ...admins.map((a) => ({
      row: {
        kind: "admin" as const,
        id: a.id,
        name: a.name ?? "—",
        email: a.email,
        role: a.role,
        status: a.status,
        location: "—",
      },
      createdAt: a.createdAt,
    })),
    ...artisans.map((a) => ({
      row: {
        kind: "artisan" as const,
        id: a.id,
        firstName: a.firstName ?? "",
        lastName: a.lastName ?? "",
        email: a.user.email,
        role: a.user.role,
        status: a.user.status,
        primarySkill: a.primarySkill,
        location: [a.city, a.state].filter(Boolean).join(", ") || "—",
        profilePhotoUrl: a.profilePhotoUrl ?? null,
      },
      createdAt: a.user.createdAt,
    })),
    ...homeowners.map((h) => ({
      row: {
        kind: "homeowner" as const,
        id: h.id,
        fullName: h.fullName ?? "",
        email: h.user.email,
        role: h.user.role,
        status: h.user.status,
        location: [h.city, h.state].filter(Boolean).join(", ") || "—",
        profilePhotoUrl: h.profilePhotoUrl ?? null,
      },
      createdAt: h.user.createdAt,
    })),
  ];

  const rows = withDates
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(({ row }) => row);

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Total users</h1>
      <div className="mt-6 rounded-xl border bg-card">
        <UsersTable initialRows={rows} />
      </div>
    </main>
  );
}
