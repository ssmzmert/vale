import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export const runtime = "nodejs";
const MAX_DB_BYTES = 500 * 1024 * 1024;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["ADMIN"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  await connectToDatabase();

  let usedBytes = 0;
  try {
    const stats = await mongoose.connection.db?.stats();
    usedBytes = stats?.storageSize || 0;
  } catch (error) {
    console.error("Failed to read db stats", error);
  }

  return NextResponse.json({
    storageUsage: {
      usedBytes,
      maxBytes: MAX_DB_BYTES
    }
  });
}
