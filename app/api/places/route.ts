import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Place } from "@/models/Place";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  await connectToDatabase();
  let places: any[] = [];
  if ((session.user as any).role === "ADMIN") {
    places = await Place.find({ active: true }).sort({ name: 1 }).lean();
  } else {
    const placeId = (session.user as any).placeId;
    if (!placeId || !mongoose.Types.ObjectId.isValid(placeId)) {
      places = [];
    } else {
      const place = await Place.findOne({ _id: placeId, active: true }).lean();
      places = place ? [place] : [];
    }
  }

  return NextResponse.json({ places });
}
