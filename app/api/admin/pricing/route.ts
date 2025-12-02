import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PricingConfig } from "@/models/PricingConfig";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  await connectToDatabase();
  const config = await PricingConfig.findOne({ active: true })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();
  const {
    mode,
    fixedFeeCents,
    hourlyFeeCents,
    bronzeFixedFeeCents,
    bronzeHourlyFeeCents,
    silverFixedFeeCents,
    silverHourlyFeeCents,
    goldFixedFeeCents,
    goldHourlyFeeCents,
    graceMinutes,
    roundingMinutes
  } = body;

  if (!mode || !["FIXED", "HOURLY"].includes(mode)) {
    return NextResponse.json({ error: "Geçersiz mod" }, { status: 400 });
  }

  await connectToDatabase();
  await PricingConfig.updateMany({ active: true }, { $set: { active: false } });

  const config = await PricingConfig.create({
    mode,
    fixedFeeCents: fixedFeeCents !== undefined ? Number(fixedFeeCents) : null,
    hourlyFeeCents: hourlyFeeCents !== undefined ? Number(hourlyFeeCents) : null,
    bronzeFixedFeeCents: bronzeFixedFeeCents !== undefined ? Number(bronzeFixedFeeCents) : null,
    bronzeHourlyFeeCents: bronzeHourlyFeeCents !== undefined ? Number(bronzeHourlyFeeCents) : null,
    silverFixedFeeCents: silverFixedFeeCents !== undefined ? Number(silverFixedFeeCents) : null,
    silverHourlyFeeCents: silverHourlyFeeCents !== undefined ? Number(silverHourlyFeeCents) : null,
    goldFixedFeeCents: goldFixedFeeCents !== undefined ? Number(goldFixedFeeCents) : null,
    goldHourlyFeeCents: goldHourlyFeeCents !== undefined ? Number(goldHourlyFeeCents) : null,
    graceMinutes: Number(graceMinutes) || 0,
    roundingMinutes: Number(roundingMinutes) || 0,
    active: true
  });

  return NextResponse.json({ config });
}
