import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";
import { HomeownersTable } from "@/components/admin/homeowners-table";

export default async function AdminHomeownersPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const homeowners = await userRepository.listAllHomeowners();

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Homeowners</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All registered homeowners — {homeowners.length} total
      </p>
      <div className="mt-6 rounded-xl border bg-card">
        <HomeownersTable initialRows={homeowners.map((h) => ({ ...h, profilePhotoUrl: h.profilePhotoUrl ?? null }))} />
      </div>
    </main>
  );
}
