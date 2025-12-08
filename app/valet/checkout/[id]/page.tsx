import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/valet/CheckoutClient";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParkingSession } from "@/models/ParkingSession";
import { PricingConfig } from "@/models/PricingConfig";

export const runtime = "nodejs";

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/giris");

  await connectToDatabase();
  const parking = await ParkingSession.findById(id)
    .populate("checkinOperator", "name")
    .lean();

  if (!parking || parking.status !== "OPEN") redirect("/valet");

  const userRole = (session.user as any).role;
  const userPlace = (session.user as any).placeId;
  if (userRole !== "ADMIN" && !userPlace) {
    redirect("/valet");
  }
  if (
    userRole !== "ADMIN" &&
    parking.place &&
    userPlace &&
    parking.place.toString() !== userPlace
  ) {
    redirect("/valet");
  }

  const pricing = await PricingConfig.findOne({ active: true }).sort({ createdAt: -1 }).lean();
  if (!pricing) redirect("/valet");

  const cleanSession = {
    _id: parking._id.toString(),
    plateNumber: parking.plateNumber,
    checkinAt: parking.checkinAt.toISOString(),
    checkinOperatorName: (parking as any).checkinOperator?.name
  };

  const cleanPricing = {
    mode: pricing.mode,
    fixedFeeCents: pricing.fixedFeeCents ?? undefined,
    hourlyFeeCents: pricing.hourlyFeeCents ?? undefined,
    bronzeFixedFeeCents: pricing.bronzeFixedFeeCents ?? undefined,
    bronzeHourlyFeeCents: pricing.bronzeHourlyFeeCents ?? undefined,
    silverFixedFeeCents: pricing.silverFixedFeeCents ?? undefined,
    silverHourlyFeeCents: pricing.silverHourlyFeeCents ?? undefined,
    goldFixedFeeCents: pricing.goldFixedFeeCents ?? undefined,
    goldHourlyFeeCents: pricing.goldHourlyFeeCents ?? undefined,
    graceMinutes: pricing.graceMinutes || 0,
    roundingMinutes: pricing.roundingMinutes || 0
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <CheckoutClient session={cleanSession} pricing={cleanPricing} />
    </div>
  );
}
