import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParkingSession } from "@/models/ParkingSession";
import mongoose from "mongoose";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const runtime = "nodejs";
const MAX_DB_BYTES = 500 * 1024 * 1024;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["ADMIN", "VIEWER"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 25);
  const placeParam = searchParams.get("place");

  const toDate = toParam ? endOfDay(new Date(toParam)) : endOfDay(new Date());
  const fromDate = fromParam
    ? startOfDay(new Date(fromParam))
    : startOfDay(subDays(toDate, 7));

  const match = {
    status: "CLOSED",
    checkoutAt: { $gte: fromDate, $lte: toDate }
  } as any;

  if ((session.user as any).role === "VIEWER") {
    const viewerPlace = (session.user as any).placeId;
    if (!viewerPlace || !mongoose.Types.ObjectId.isValid(viewerPlace)) {
      return NextResponse.json({ error: "Mekan ataması bulunamadı" }, { status: 400 });
    }
    match.place = new mongoose.Types.ObjectId(viewerPlace);
  } else if (placeParam) {
    const requested = placeParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (requested.length > 0) {
      match.place = { $in: requested };
    }
  }

  await connectToDatabase();

  let storageUsage = { usedBytes: 0, maxBytes: MAX_DB_BYTES };
  try {
    const stats = await mongoose.connection.db?.stats();
    storageUsage.usedBytes = stats?.storageSize || 0;
  } catch (error) {
    console.error("Failed to read db stats", error);
  }

  const [metricsResult] = await ParkingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalRevenue: { $sum: "$feeCents" },
        totalDuration: { $sum: "$durationMinutes" }
      }
    }
  ]);

  const operatorStats = await ParkingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$checkoutOperator",
        cars: { $sum: 1 },
        totalFees: { $sum: "$feeCents" },
        totalDuration: { $sum: "$durationMinutes" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "operator"
      }
    },
    { $unwind: { path: "$operator", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        operatorId: "$operator._id",
        operatorName: "$operator.name",
        cars: 1,
        totalFees: 1,
        totalDuration: 1
      }
    }
  ]);

  const totalSessions = await ParkingSession.countDocuments(match);
  const sessions = await ParkingSession.find(match)
    .populate("checkinOperator", "name email")
    .populate("checkoutOperator", "name email")
    .populate("place", "name")
    .select("+pricingTier")
    .sort({ checkoutAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const metrics = {
    totalCount: metricsResult?.totalCount || 0,
    totalRevenue: metricsResult?.totalRevenue || 0,
    avgDuration:
      metricsResult?.totalCount > 0
        ? Math.round(metricsResult.totalDuration / metricsResult.totalCount)
        : 0
  };

  return NextResponse.json({
    range: { from: fromDate, to: toDate },
    metrics,
    storageUsage,
    operatorStats,
    sessions,
    totalSessions,
    page,
    limit
  });
}
