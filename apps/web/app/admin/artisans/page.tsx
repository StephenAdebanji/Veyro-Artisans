import { redirect } from "next/navigation";
import { auth } from "@/platform/auth-session";
import { userRepository } from "@/services/user/user.repository";
import { ArtisansTable } from "@/components/admin/artisans-table";

export default async function AdminArtisansPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") redirect("/sign-in");

  const artisans = await userRepository.listAllArtisans();

  return (
    <main className="flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">Artisans</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All registered artisans — {artisans.length} total
      </p>
      <div className="mt-6 rounded-xl border bg-card">
        <ArtisansTable initialRows={artisans} />
      </div>
    </main>
  );
}
