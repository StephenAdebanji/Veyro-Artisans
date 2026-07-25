import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { authRepository } from "@/services/auth/auth.repository";
import { userRepository } from "@/services/user/user.repository";
import { UsersTable, type UserRow } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const [admins, artisans, homeowners] = await Promise.all([
    authRepository.listByRole("ADMIN"),
    userRepository.listAllArtisans(),
    userRepository.listAllHomeowners(),
  ]);

  const rows: UserRow[] = [
    ...admins.map((a) => ({
      id: a.id,
      name: a.name ?? "—",
      email: a.email,
      role: a.role,
      status: a.status,
      location: "—",
      createdAt: a.createdAt.toISOString(),
    })),
    ...artisans.map((a) => ({
      id: a.id,
      name: [a.firstName, a.lastName].filter(Boolean).join(" ") || "—",
      email: a.user.email,
      role: a.user.role,
      status: a.user.status,
      location: [a.city, a.state].filter(Boolean).join(", ") || "—",
      createdAt: a.user.createdAt.toISOString(),
      href: `/admin/artisans/${a.id}`,
    })),
    ...homeowners.map((h) => ({
      id: h.id,
      name: h.fullName ?? "—",
      email: h.user.email,
      role: h.user.role,
      status: h.user.status,
      location: [h.city, h.state].filter(Boolean).join(", ") || "—",
      createdAt: h.user.createdAt.toISOString(),
      href: `/admin/homeowners/${h.id}`,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Total users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All registered users across the platform — {rows.length} total
      </p>
      <div className="mt-6 rounded-xl border bg-card">
        <UsersTable initialRows={rows} />
      </div>
    </main>
  );
}
