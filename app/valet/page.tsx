import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { ValetDashboard } from "@/components/valet/ValetDashboard";

export const runtime = "nodejs";

export default async function ValetPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/giris");

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <ValetDashboard operatorName={session.user.name || "Operatör"} />
    </div>
  );
}
