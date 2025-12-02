import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParkingSession } from "@/models/ParkingSession";
import { PricingConfig } from "@/models/PricingConfig";
import { calculateFee } from "@/lib/fee";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "VALET"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, paymentMethod, pricingTier } = body as {
    sessionId?: string;
    paymentMethod?: "CASH" | "CARD";
    pricingTier?: "STANDARD" | "BRONZE" | "SILVER" | "GOLD";
  };

  if (!sessionId || !paymentMethod) {
    return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
  }

  await connectToDatabase();

  const parking = await ParkingSession.findById(sessionId);
  if (!parking || parking.status !== "OPEN") {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  const userRole = session.user.role;
  const userPlace = (session.user as any).placeId;
  if (userRole !== "ADMIN" && !userPlace) {
    return NextResponse.json({ error: "Mekan ataması bulunamadı" }, { status: 400 });
  }
  if (
    userRole !== "ADMIN" &&
    parking.place &&
    userPlace &&
    parking.place.toString() !== userPlace
  ) {
    return NextResponse.json({ error: "Bu mekan için yetkiniz yok" }, { status: 403 });
  }

  const config =
    (await PricingConfig.findOne({ active: true }).sort({ createdAt: -1 }).lean()) ??
    null;

  if (!config) {
    return NextResponse.json({ error: "Aktif fiyatlandırma bulunamadı" }, { status: 400 });
  }

  const checkoutAt = new Date();
  const durationMinutes = Math.floor(
    (checkoutAt.getTime() - parking.checkinAt.getTime()) / 60000
  );
  const selectedTier = pricingTier || "STANDARD";
  const { feeCents } = calculateFee(durationMinutes, config, selectedTier);

  parking.checkoutOperator = session.user.id as any;
  parking.checkoutAt = checkoutAt;
  parking.durationMinutes = durationMinutes;
  parking.feeCents = feeCents;
  parking.paymentMethod = paymentMethod;
  parking.paymentCollected = true;
  parking.paymentCollectedAt = new Date();
  parking.pricingTier = selectedTier as any;
  parking.status = "CLOSED";

  await parking.save();

  return NextResponse.json({ session: parking });
}
