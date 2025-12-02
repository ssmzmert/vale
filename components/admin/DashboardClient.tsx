"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { formatDuration, formatTL } from "@/lib/fee";
import { formatDateTime } from "@/lib/date";

interface DashboardResponse {
  metrics: { totalCount: number; totalRevenue: number; avgDuration: number };
  operatorStats: {
    operatorId?: string;
    operatorName?: string;
    cars: number;
    totalFees: number;
    totalDuration: number;
  }[];
  sessions: any[];
  totalSessions: number;
  page: number;
  limit: number;
  storageUsage?: {
    usedBytes: number;
    maxBytes: number;
  };
}

interface OpenSession {
  _id: string;
  ticketNumber: string;
  plateNumber: string;
  checkinAt: string;
  checkinOperator?: { name?: string };
  place?: { _id: string; name?: string };
}

interface PlaceOption {
  _id: string;
  name: string;
}

function toInputDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function DashboardClient({
  userRole = "ADMIN",
  userPlaceId = null,
}: {
  userRole?: "ADMIN" | "VIEWER" | "VALET";
  userPlaceId?: string | null;
}) {
  const canEdit = userRole === "ADMIN";
  const [from, setFrom] = useState(() => toInputDate(new Date()));
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [openLoading, setOpenLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlate, setEditPlate] = useState("");
  const [editPayment, setEditPayment] = useState<"CASH" | "CARD">("CASH");
  const [editTier, setEditTier] = useState<
    "STANDARD" | "BRONZE" | "SILVER" | "GOLD"
  >("STANDARD");
  const [editFee, setEditFee] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>(() =>
    userRole === "VIEWER" && userPlaceId ? [userPlaceId] : []
  );
  const placeValue = selectedPlaces.length > 0 ? selectedPlaces.join(",") : "";

  const loadPlaces = async () => {
    setPlacesLoading(true);
    const res = await fetch("/api/places", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setPlaces(json.places || []);
      if (userRole === "VIEWER" && json.places?.[0]?._id) {
        setSelectedPlaces([json.places[0]._id]);
      }
    }
    setPlacesLoading(false);
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ from, to, page: String(page) });
    if (placeValue) {
      params.append("place", placeValue);
    }
    const res = await fetch(`/api/admin/dashboard?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const json = await res.json();
      alert(json.error || "Veriler alınamadı");
      setData(null);
      setLoading(false);
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const startEdit = (s: any) => {
    if (!canEdit) return;
    setEditingId(s._id);
    setEditPlate(s.plateNumber || "");
    setEditPayment(s.paymentMethod || "CASH");
    setEditTier(s.pricingTier || "STANDARD");
    setEditFee(Math.round((s.feeCents || 0) / 100));
  };

  const saveEdit = async () => {
    if (!editingId || !canEdit) return;
    setSavingEdit(true);
    await fetch(`/api/admin/sessions/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plateNumber: editPlate,
        paymentMethod: editPayment,
        pricingTier: editTier,
        feeCents: Math.round(editFee * 100),
      }),
    });
    setSavingEdit(false);
    setEditingId(null);
    fetchData(data?.page || 1);
  };

  const deleteSession = async (id: string) => {
    if (!canEdit) return;
    const confirmDelete = window.confirm(
      "Bu oturumu silmek istediğinize emin misiniz?"
    );
    if (!confirmDelete) return;
    await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    fetchData(data?.page || 1);
  };

  const fetchOpenSessions = async () => {
    setOpenLoading(true);
    const params = new URLSearchParams();
    if (placeValue) params.append("place", placeValue);
    const query = params.toString();
    const res = await fetch(`/api/parking/open${query ? `?${query}` : ""}`, { cache: "no-store" });
    if (!res.ok) {
      setOpenSessions([]);
      setOpenLoading(false);
      return;
    }
    const json = await res.json();
    setOpenSessions(json.sessions || []);
    setOpenLoading(false);
  };

  const togglePlace = (id: string) => {
    if (userRole !== "ADMIN") return;
    setSelectedPlaces((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const applyFilters = () => {
    fetchData();
    fetchOpenSessions();
  };

  useEffect(() => {
    loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    fetchOpenSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = data?.metrics || {
    totalCount: 0,
    totalRevenue: 0,
    avgDuration: 0,
  };

  const handleExport = (type: "excel") => {
    const params = new URLSearchParams({ from, to });
    if (placeValue) params.append("place", placeValue);
    window.open(`/api/export/${type}?${params.toString()}`, "_blank");
  };

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.totalSessions / data.limit));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <span className="text-gray-500">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Mekan:</span>
          {userRole === "ADMIN" && (
            <button
              onClick={() => setSelectedPlaces([])}
              className={`px-3 py-2 rounded-lg border text-sm ${
                selectedPlaces.length === 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              Tümü
            </button>
          )}
          {places.map((place) => {
            const active = selectedPlaces.includes(place._id);
            return (
              <button
                key={place._id}
                onClick={() => togglePlace(place._id)}
                disabled={userRole !== "ADMIN"}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  active ? "border-primary bg-primary/10 text-primary" : "border-gray-200"
                } ${userRole !== "ADMIN" ? "opacity-80 cursor-not-allowed" : ""}`}
              >
                {place.name}
              </button>
            );
          })}
          {placesLoading && <span className="text-sm text-gray-500">Mekanlar yükleniyor...</span>}
          {!placesLoading && places.length === 0 && (
            <span className="text-sm text-gray-500">Tanımlı mekan yok.</span>
          )}
        </div>
        <button
          onClick={applyFilters}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold"
        >
          Uygula
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Kapanan fiş</p>
          <p className="text-2xl font-bold">{metrics.totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Toplam gelir</p>
          <p className="text-2xl font-bold">{formatTL(metrics.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Ortalama süre</p>
          <p className="text-2xl font-bold">
            {formatDuration(metrics.avgDuration)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aktif Araçlar</h2>
          {openLoading && (
            <span className="text-sm text-gray-500">Yükleniyor...</span>
          )}
        </div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {!openLoading && openSessions.length === 0 && (
            <p className="text-sm text-gray-500">Aktif araç bulunmuyor.</p>
          )}
          {openSessions.map((s) => (
            <div
              key={s._id}
              className="border rounded-lg px-3 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {s.ticketNumber} · {s.plateNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Giriş: {formatDateTime(s.checkinAt)} ·{" "}
                  {s.checkinOperator?.name || "-"}
                </p>
                {s.place?.name && (
                  <p className="text-xs text-gray-500">Mekan: {s.place.name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Operatör Bazında</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("excel")}
              className="px-3 py-2 rounded-lg border text-sm"
            >
              Excel
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Operatör</th>
                <th className="py-2">Araç</th>
                <th className="py-2">Süre</th>
                <th className="py-2">Ücret</th>
              </tr>
            </thead>
            <tbody>
              {data?.operatorStats?.map((op) => (
                <tr key={op.operatorId || op.operatorName}>
                  <td className="py-2">{op.operatorName || "—"}</td>
                  <td className="py-2">{op.cars}</td>
                  <td className="py-2">{formatDuration(op.totalDuration)}</td>
                  <td className="py-2">{formatTL(op.totalFees)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Oturum Detayı</h2>
          {loading && (
            <span className="text-sm text-gray-500">Yükleniyor...</span>
          )}
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Fiş</th>
                <th className="py-2">Plaka</th>
                <th className="py-2">Mekan</th>
                <th className="py-2">Giriş</th>
                <th className="py-2">Çıkış</th>
                <th className="py-2">Süre</th>
                <th className="py-2">Ücret</th>
                <th className="py-2">Ödeme</th>
                <th className="py-2">Tarife</th>
                <th className="py-2">Giriş Operatörü</th>
                <th className="py-2">Çıkış Operatörü</th>
                {canEdit && <th className="py-2">İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {data?.sessions?.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="py-2">{s.ticketNumber}</td>
                  <td className="py-2">{s.plateNumber}</td>
                  <td className="py-2">{(s.place as any)?.name || "—"}</td>
                  <td className="py-2">{formatDateTime(s.checkinAt)}</td>
                  <td className="py-2">{formatDateTime(s.checkoutAt)}</td>
                  <td className="py-2">{formatDuration(s.durationMinutes)}</td>
                  <td className="py-2">{formatTL(s.feeCents)}</td>
                  <td className="py-2">
                    {s.paymentMethod == "CASH" ? "NAKİT" : "KREDI KARTI"}
                  </td>
                  <td className="py-2">{s.pricingTier || "STANDARD"}</td>
                  <td className="py-2">
                    {(s.checkinOperator as any)?.name || "-"}
                  </td>
                  <td className="py-2">
                    {(s.checkoutOperator as any)?.name || "-"}
                  </td>
                  {canEdit && (
                    <td className="py-2 space-x-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="text-primary text-xs underline"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => deleteSession(s._id)}
                        className="text-red-600 text-xs underline"
                      >
                        Sil
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Sayfa {data?.page || 1} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={(data?.page || 1) <= 1}
              onClick={() => fetchData((data?.page || 1) - 1)}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              disabled={(data?.page || 1) >= totalPages}
              onClick={() => fetchData((data?.page || 1) + 1)}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>
      {editingId && canEdit && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Oturumu Düzenle</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Plaka</label>
                <input
                  value={editPlate}
                  onChange={(e) => setEditPlate(e.target.value.toUpperCase())}
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3">
                {["CASH", "CARD"].map((pm) => (
                  <button
                    key={pm}
                    onClick={() => setEditPayment(pm as "CASH" | "CARD")}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      editPayment === pm
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200"
                    }`}
                  >
                    {pm === "CASH" ? "Nakit" : "Kredi Kartı"}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "STANDARD", label: "Standart" },
                  { value: "BRONZE", label: "Bronz" },
                  { value: "SILVER", label: "Silver" },
                  { value: "GOLD", label: "Gold" },
                ].map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => setEditTier(tier.value as any)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      editTier === tier.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm text-gray-600">Ücret (TL)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editFee}
                  onChange={(e) => setEditFee(Number(e.target.value))}
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-lg border text-sm"
                disabled={savingEdit}
              >
                İptal
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-60"
              >
                {savingEdit ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
