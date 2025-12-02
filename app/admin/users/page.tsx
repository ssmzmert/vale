import { redirect } from "next/navigation";
import { UsersManager } from "@/components/admin/UsersManager";
import { getServerAuthSession } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const runtime = "nodejs";

export default async function UsersPage() {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/giris");

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminHeader title="Kullanıcılar" subtitle="Yönetim" />
        <UsersManager />
      </div>
    </div>
  );
}
