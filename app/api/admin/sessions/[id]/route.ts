import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParkingSession } from "@/models/ParkingSession";

export const runtime = "nodejs";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { paymentMethod, pricingTier, feeCents, plateNumber } = body as {
    paymentMethod?: "CASH" | "CARD";
    pricingTier?: "STANDARD" | "BRONZE" | "SILVER" | "GOLD";
    feeCents?: number;
    plateNumber?: string;
  };

  await connectToDatabase();
  const record = await ParkingSession.findById(params.id);
  if (!record) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  if (paymentMethod) record.paymentMethod = paymentMethod;
  if (pricingTier) record.pricingTier = pricingTier;
  if (typeof feeCents === "number" && !Number.isNaN(feeCents)) {
    record.feeCents = feeCents;
  }
    if (plateNumber && plateNumber.trim()) {
      record.plateNumber = plateNumber.trim().toUpperCase();
    }
  await record.save();

  return NextResponse.json({ session: record });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  await connectToDatabase();
  const record = await ParkingSession.findById(params.id);
  if (!record) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  await record.deleteOne();
  return NextResponse.json({ ok: true });
}
