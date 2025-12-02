"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateFee, formatDuration, formatTL } from "@/lib/fee";
import { formatDateTime } from "@/lib/date";

interface CheckoutSession {
  _id: string;
  plateNumber: string;
  checkinAt: string;
  checkinOperatorName?: string;
}

interface Pricing {
  mode: "FIXED" | "HOURLY";
  fixedFeeCents?: number;
  hourlyFeeCents?: number;
  bronzeFixedFeeCents?: number;
  bronzeHourlyFeeCents?: number;
  silverFixedFeeCents?: number;
  silverHourlyFeeCents?: number;
  goldFixedFeeCents?: number;
  goldHourlyFeeCents?: number;
  graceMinutes: number;
  roundingMinutes: number;
}

export function CheckoutClient({
  session,
  pricing,
}: {
  session: CheckoutSession;
  pricing: Pricing;
}) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [pricingTier, setPricingTier] = useState<
    "STANDARD" | "BRONZE" | "SILVER" | "GOLD"
  >("STANDARD");
  const [processing, setProcessing] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(() =>
    Math.max(
      0,
      Math.floor((Date.now() - new Date(session.checkinAt).getTime()) / 60000)
    )
  );

  useEffect(() => {
    const id = setInterval(() => {
      setDurationMinutes(
        Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(session.checkinAt).getTime()) / 60000
          )
        )
      );
    }, 30000);
    return () => clearInterval(id);
  }, [session.checkinAt]);

  const feeResult = useMemo(
    () => calculateFee(durationMinutes, pricing as any, pricingTier),
    [durationMinutes, pricing, pricingTier]
  );

  const handleCheckout = async () => {
    setProcessing(true);
    const res = await fetch("/api/parking/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session._id, paymentMethod, pricingTier }),
    });
    if (!res.ok) {
      setProcessing(false);
      alert("İşlem başarısız. Yeniden deneyin.");
      return;
    }
    router.replace("/valet");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Plaka</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {session.plateNumber}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Giriş Operatörü</p>
            <p className="font-semibold">
              {session.checkinOperatorName || "-"}
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border rounded-lg">
            <p className="text-xs uppercase text-gray-500">Giriş Zamanı</p>
            <p className="font-semibold">{formatDateTime(session.checkinAt)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-xs uppercase text-gray-500">Süre</p>
            <p className="font-semibold">{formatDuration(durationMinutes)}</p>
          </div>
          <div className="p-4 border rounded-lg bg-primary/10 text-primary">
            <p className="text-xs uppercase">Hesaplanan Ücret</p>
            <p className="text-xl font-bold">{formatTL(feeResult.feeCents)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold">Tarife</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { value: "STANDARD" as const, label: "Standart" },
            { value: "BRONZE" as const, label: "Bronz" },
            { value: "SILVER" as const, label: "Silver" },
            { value: "GOLD" as const, label: "Gold" }
          ].map((tier) => (
            <button
              key={tier.value}
              onClick={() => setPricingTier(tier.value)}
              className={`px-4 py-2 rounded-lg border ${
                pricingTier === tier.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
        <h3 className="text-lg font-semibold">Ödeme Yöntemi</h3>
        <div className="flex gap-3">
          {["CASH", "CARD"].map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method as "CASH" | "CARD")}
              className={`px-4 py-2 rounded-lg border ${
                paymentMethod === method
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200"
              }`}
            >
              {method === "CASH" ? "Nakit" : "Kredi Kartı"}
            </button>
          ))}
        </div>
        <button
          onClick={handleCheckout}
          disabled={processing}
          className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold hover:bg-teal-700 transition disabled:opacity-60"
        >
          {processing ? "Çıkış tamamlanıyor..." : "Çıkışı Tamamla"}
        </button>
      </div>
    </div>
  );
}
