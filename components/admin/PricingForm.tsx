"use client";

import { useEffect, useState } from "react";

interface PricingFormState {
  mode: "FIXED" | "HOURLY";
  fixedFeeTL?: number;
  bronzeFixedFeeTL?: number;
  silverFixedFeeTL?: number;
  goldFixedFeeTL?: number;
  hourlyFeeTL?: number;
  bronzeHourlyFeeTL?: number;
  silverHourlyFeeTL?: number;
  goldHourlyFeeTL?: number;
  graceMinutes: number;
}

export function PricingForm() {
  const [config, setConfig] = useState<PricingFormState>({
    mode: "FIXED",
    fixedFeeTL: 0,
    bronzeFixedFeeTL: 0,
    silverFixedFeeTL: 0,
    goldFixedFeeTL: 0,
    hourlyFeeTL: 0,
    bronzeHourlyFeeTL: 0,
    silverHourlyFeeTL: 0,
    goldHourlyFeeTL: 0,
    graceMinutes: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadConfig = async () => {
    const res = await fetch("/api/admin/pricing", { cache: "no-store" });
    const data = await res.json();
    if (data?.config) {
      setConfig({
        mode: data.config.mode,
        fixedFeeTL:
          data.config.fixedFeeCents !== undefined
            ? Number(data.config.fixedFeeCents) / 100
            : 0,
        bronzeFixedFeeTL:
          data.config.bronzeFixedFeeCents !== undefined
            ? Number(data.config.bronzeFixedFeeCents) / 100
            : 0,
        silverFixedFeeTL:
          data.config.silverFixedFeeCents !== undefined
            ? Number(data.config.silverFixedFeeCents) / 100
            : 0,
        goldFixedFeeTL:
          data.config.goldFixedFeeCents !== undefined
            ? Number(data.config.goldFixedFeeCents) / 100
            : 0,
        hourlyFeeTL:
          data.config.hourlyFeeCents !== undefined
            ? Number(data.config.hourlyFeeCents) / 100
            : 0,
        bronzeHourlyFeeTL:
          data.config.bronzeHourlyFeeCents !== undefined
            ? Number(data.config.bronzeHourlyFeeCents) / 100
            : 0,
        silverHourlyFeeTL:
          data.config.silverHourlyFeeCents !== undefined
            ? Number(data.config.silverHourlyFeeCents) / 100
            : 0,
        goldHourlyFeeTL:
          data.config.goldHourlyFeeCents !== undefined
            ? Number(data.config.goldHourlyFeeCents) / 100
            : 0,
        graceMinutes: data.config.graceMinutes ?? 0,
      });
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const payload = {
      mode: config.mode,
      fixedFeeCents:
        config.fixedFeeTL !== undefined
          ? Math.round(Number(config.fixedFeeTL) * 100)
          : undefined,
      bronzeFixedFeeCents:
        config.bronzeFixedFeeTL !== undefined
          ? Math.round(Number(config.bronzeFixedFeeTL) * 100)
          : undefined,
      silverFixedFeeCents:
        config.silverFixedFeeTL !== undefined
          ? Math.round(Number(config.silverFixedFeeTL) * 100)
          : undefined,
      goldFixedFeeCents:
        config.goldFixedFeeTL !== undefined
          ? Math.round(Number(config.goldFixedFeeTL) * 100)
          : undefined,
      hourlyFeeCents:
        config.hourlyFeeTL !== undefined
          ? Math.round(Number(config.hourlyFeeTL) * 100)
          : undefined,
      bronzeHourlyFeeCents:
        config.bronzeHourlyFeeTL !== undefined
          ? Math.round(Number(config.bronzeHourlyFeeTL) * 100)
          : undefined,
      silverHourlyFeeCents:
        config.silverHourlyFeeTL !== undefined
          ? Math.round(Number(config.silverHourlyFeeTL) * 100)
          : undefined,
      goldHourlyFeeCents:
        config.goldHourlyFeeTL !== undefined
          ? Math.round(Number(config.goldHourlyFeeTL) * 100)
          : undefined,
      graceMinutes: config.graceMinutes,
      roundingMinutes: 0,
    };
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("Fiyatlandırma güncellendi");
      loadConfig();
    } else {
      setMessage("Hata oluştu");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold">Fiyatlandırma</h1>
        <p className="text-sm text-gray-500">
          Aktif yapılandırmayı güncellemek için formu doldurun.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Mod</label>
            <select
              value={config.mode}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  mode: e.target.value as PricingFormState["mode"],
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option value="FIXED">Sabit</option>
              <option value="HOURLY">Saatlik</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Müsade Süresi (dk)</label>
            <input
              type="number"
              value={config.graceMinutes}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  graceMinutes: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Sabit Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.fixedFeeTL ?? 0}
              disabled={config.mode !== "FIXED"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  fixedFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Saatlik Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.hourlyFeeTL ?? 0}
              disabled={config.mode !== "HOURLY"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  hourlyFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Bronz Sabit Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.bronzeFixedFeeTL ?? 0}
              disabled={config.mode !== "FIXED"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  bronzeFixedFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Bronz Saatlik Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.bronzeHourlyFeeTL ?? 0}
              disabled={config.mode !== "HOURLY"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  bronzeHourlyFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Silver Sabit Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.silverFixedFeeTL ?? 0}
              disabled={config.mode !== "FIXED"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  silverFixedFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Silver Saatlik Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.silverHourlyFeeTL ?? 0}
              disabled={config.mode !== "HOURLY"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  silverHourlyFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Gold Sabit Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.goldFixedFeeTL ?? 0}
              disabled={config.mode !== "FIXED"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  goldFixedFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Gold Saatlik Ücret (TL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={config.goldHourlyFeeTL ?? 0}
              disabled={config.mode !== "HOURLY"}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  goldHourlyFeeTL: Number(e.target.value),
                }))
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
      {message && <p className="text-sm text-primary">{message}</p>}
    </div>
  );
}
