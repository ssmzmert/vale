import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StorageUsageClient } from "@/components/admin/StorageUsageClient";
import { getServerAuthSession } from "@/lib/auth";

export const runtime = "nodejs";

export default async function StoragePage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/giris");
  if (!["ADMIN"].includes((session.user as any).role)) redirect("/giris");

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminHeader
          title="Depolama"
          subtitle="Veritabanı alanı"
          userRole={(session.user as any).role}
        />
        <StorageUsageClient />
      </div>
    </div>
  );
}
