import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getServerAuthSession } from "@/lib/auth";
import { DashboardClient } from "@/components/admin/DashboardClient";

export const runtime = "nodejs";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/giris");
  if (!["ADMIN", "VIEWER"].includes((session.user as any).role)) redirect("/giris");

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminHeader
          title="Yönetim Paneli"
          subtitle="Genel görünüm"
          userRole={(session.user as any).role}
        />
        <DashboardClient
          userRole={(session.user as any).role as "ADMIN" | "VIEWER"}
          userPlaceId={(session.user as any).placeId || null}
        />
      </div>
    </div>
  );
}
