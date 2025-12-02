import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ExcelJS from "exceljs";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ParkingSession } from "@/models/ParkingSession";
import mongoose from "mongoose";

export const runtime = "nodejs";

function parseRange(url: string) {
  const { searchParams } = new URL(url);
  const toParam = searchParams.get("to");
  const fromParam = searchParams.get("from");
  const placeParam = searchParams.get("place");
  const to = toParam ? endOfDay(new Date(toParam)) : endOfDay(new Date());
  const from = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(subDays(to, 7));
  return { from, to, placeParam };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { from, to, placeParam } = parseRange(req.url);
  await connectToDatabase();
  const match: any = {
    status: "CLOSED",
    checkoutAt: { $gte: from, $lte: to }
  };
  if (placeParam) {
    const placeIds = placeParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (placeIds.length > 0) {
      match.place = { $in: placeIds };
    }
  }
  const sessions = await ParkingSession.find({
    ...match
  })
    .populate("checkinOperator", "name")
    .populate("checkoutOperator", "name")
    .populate("place", "name")
    .sort({ checkoutAt: -1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Oturumlar");

  sheet.columns = [
    { header: "Fiş No", key: "ticketNumber", width: 20 },
    { header: "Plaka", key: "plateNumber", width: 15 },
    { header: "Mekan", key: "placeName", width: 18 },
    { header: "Giriş", key: "checkinAt", width: 20 },
    { header: "Çıkış", key: "checkoutAt", width: 20 },
    { header: "Süre (dk)", key: "durationMinutes", width: 12 },
    { header: "Ücret (TL)", key: "fee", width: 14 },
    { header: "Ödeme", key: "paymentMethod", width: 12 },
    { header: "Tarife", key: "pricingTier", width: 12 },
    { header: "Giriş Operatörü", key: "checkinOperator", width: 22 },
    { header: "Çıkış Operatörü", key: "checkoutOperator", width: 22 }
  ];

  let totalFee = 0;
  let totalDuration = 0;

  sessions.forEach((s: any) => {
    totalFee += s.feeCents || 0;
    totalDuration += s.durationMinutes || 0;
    sheet.addRow({
      ticketNumber: s.ticketNumber,
      plateNumber: s.plateNumber,
      placeName: (s.place as any)?.name || "",
      checkinAt: s.checkinAt ? format(new Date(s.checkinAt), "dd.MM.yyyy HH:mm") : "",
      checkoutAt: s.checkoutAt ? format(new Date(s.checkoutAt), "dd.MM.yyyy HH:mm") : "",
      durationMinutes: s.durationMinutes || 0,
      fee: ((s.feeCents || 0) / 100).toFixed(2),
      paymentMethod: s.paymentMethod == "CASH" ? "NAKİT" : "KREDİ KARTI",
      pricingTier: s.pricingTier || "STANDARD",
      checkinOperator: (s.checkinOperator as any)?.name || "-",
      checkoutOperator: (s.checkoutOperator as any)?.name || "-"
    });
  });

  sheet.addRow({});
  sheet.addRow({
    ticketNumber: "Toplam",
    durationMinutes: totalDuration,
    fee: (totalFee / 100).toFixed(2)
  });

  const ab = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(ab as ArrayBuffer);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=vale-${format(from, "yyyyMMdd")}-${format(
        to,
        "yyyyMMdd"
      )}.xlsx`
    }
  });
}
