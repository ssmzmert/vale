import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Place } from "@/models/Place";
import { User } from "@/models/User";

export const runtime = "nodejs";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  await connectToDatabase();
  const places = await Place.find().sort({ name: 1 }).lean();
  const users = await User.find({ role: { $in: ["VALET", "VIEWER"] } })
    .populate("place", "name")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ places, users });
}

export async function POST(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  if (!name) {
    return NextResponse.json({ error: "Mekan adı gerekli" }, { status: 400 });
  }

  await connectToDatabase();
  const existing = await Place.findOne({ name });
  if (existing) {
    return NextResponse.json({ error: "Bu isim zaten kullanılıyor" }, { status: 400 });
  }

  const place = await Place.create({ name, active: true });
  return NextResponse.json({ place });
}

export async function PATCH(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id, name, active } = body as { id?: string; name?: string; active?: boolean };
  if (!id) {
    return NextResponse.json({ error: "Mekan ID gerekli" }, { status: 400 });
  }

  await connectToDatabase();
  const place = await Place.findById(id);
  if (!place) return NextResponse.json({ error: "Mekan bulunamadı" }, { status: 404 });

  if (name && name.trim()) place.name = name.trim();
  if (typeof active === "boolean") place.active = active;
  await place.save();

  return NextResponse.json({ place });
}
