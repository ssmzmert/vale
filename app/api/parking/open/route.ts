import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParkingSession } from "@/models/ParkingSession";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["ADMIN", "VALET", "VIEWER"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const placeParam = searchParams.get("place");
  const filter: any = { status: "OPEN" };
  if (q) {
    filter.$or = [
      { plateNumber: { $regex: q, $options: "i" } },
      { ticketNumber: { $regex: q, $options: "i" } }
    ];
  }

  const userRole = (session.user as any).role;
  const userPlace = (session.user as any).placeId;
  if (userRole === "VIEWER" || userRole === "VALET") {
    if (!userPlace) {
      return NextResponse.json({ error: "Mekan ataması bulunamadı" }, { status: 400 });
    }
    filter.place = userPlace;
  } else if (placeParam) {
    const requested = placeParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (requested.length > 0) {
      filter.place = { $in: requested };
    }
  }

  await connectToDatabase();

  const sessions = await ParkingSession.find(filter)
    .populate("checkinOperator", "name email")
    .populate("place", "name")
    .sort({ checkinAt: -1 })
    .lean();

  return NextResponse.json({ sessions });
}
