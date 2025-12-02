import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PlacesManager } from "@/components/admin/PlacesManager";

export const runtime = "nodejs";

export default async function PlacesPage() {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/giris");

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminHeader title="Mekanlar" subtitle="Alan yönetimi" />
        <PlacesManager />
      </div>
    </div>
  );
}
