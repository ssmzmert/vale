import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParkingSession } from "@/models/ParkingSession";
import mongoose from "mongoose";

export const runtime = "nodejs";

function generateTicketNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(Math.random() * 9000 + 1000);
  return `VAL-${datePart}-${randomPart}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "VALET"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();
  const plateNumber = (body.plateNumber as string | undefined)?.trim();
  const requestedPlace = body.placeId as string | undefined;
  if (!plateNumber) {
    return NextResponse.json({ error: "Plaka gerekli" }, { status: 400 });
  }

  const placeId =
    requestedPlace && mongoose.Types.ObjectId.isValid(requestedPlace)
      ? requestedPlace
      : (session.user as any).placeId;

  if (session.user.role === "VALET" && !placeId) {
    return NextResponse.json({ error: "Mekan ataması bulunamadı" }, { status: 400 });
  }

  await connectToDatabase();

  const ticketNumber = generateTicketNumber();
  const checkinAt = new Date();

  const record = await ParkingSession.create({
    ticketNumber,
    plateNumber,
    checkinOperator: session.user.id,
    checkinAt,
    place: placeId ? new mongoose.Types.ObjectId(placeId) : null,
    pricingTier: "STANDARD",
    status: "OPEN"
  });

  return NextResponse.json({ session: record });
}
