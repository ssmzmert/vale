import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import mongoose from "mongoose";

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
  const users = await User.find().populate("place", "name").lean();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { name, email, password, role, placeId } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
  }

  await connectToDatabase();
  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ error: "Email kullanımda" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    role,
    passwordHash,
    place: placeId && mongoose.Types.ObjectId.isValid(placeId) ? placeId : null
  });
  const populated = await User.findById(user._id).populate("place", "name").lean();
  return NextResponse.json({ user: populated });
}

export async function PATCH(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id, active, password, role, name, placeId } = body;
  if (!id) {
    return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  if (typeof active === "boolean") user.active = active;
  if (role) user.role = role;
  if (name) user.name = name;
  if (typeof placeId === "string") {
    user.place =
      placeId && mongoose.Types.ObjectId.isValid(placeId)
        ? new mongoose.Types.ObjectId(placeId)
        : null;
  }
  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();
  const populated = await User.findById(user._id).populate("place", "name").lean();
  return NextResponse.json({ user: populated });
}
