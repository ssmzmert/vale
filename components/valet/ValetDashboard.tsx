"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/utils/logo.jpeg";
import { signOut } from "next-auth/react";
import { formatDateTime } from "@/lib/date";

interface ActiveSession {
  _id: string;
  plateNumber: string;
  checkinAt: string;
  checkinOperator?: { name?: string };
}

export function ValetDashboard({ operatorName }: { operatorName: string }) {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [fetching, setFetching] = useState(false);

  const loadSessions = async (q = "") => {
    setFetching(true);
    const res = await fetch(`/api/parking/open${q ? `?q=${q}` : ""}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Aktif fişler alınamadı");
      setSessions([]);
      setFetching(false);
      return;
    }
    setSessions(data.sessions || []);
    setFetching(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/parking/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plateNumber: plate }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`${data.session.plateNumber} kaydedildi`);
      setPlate("");
      loadSessions();
    } else {
      setMessage(data.error || "İşlem başarısız");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 relative">
            <Image
              src={logo}
              alt="Vale"
              fill
              sizes="48px"
              className="object-cover rounded-lg shadow-sm"
              priority
            />
          </div>
          <div>
            <p className="text-sm text-gray-500">Hoş geldin</p>
            <h1 className="text-2xl font-semibold text-gray-900">
              {operatorName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Aktif araç sayısı</p>
            <p className="text-xl font-bold text-primary">{sessions.length}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/giris" })}
            className="px-3 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-100"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Yeni Araç Girişi</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
              Hızlı işlem
            </span>
          </div>
          <form onSubmit={handleCheckin} className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Plaka</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                required
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:border-primary focus:ring-primary outline-none"
                placeholder="16 ABC 123"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold hover:bg-teal-700 transition disabled:opacity-60"
            >
              {loading ? "Kayıt yapılıyor..." : "Yeni Araç Kaydet"}
            </button>
          </form>
          {message && (
            <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm">
              {message}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Aktif Fişler</h2>
            <input
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                loadSessions(val);
              }}
              placeholder="Plaka ara"
              className="px-3 py-2 border rounded-lg focus:border-primary focus:ring-primary outline-none"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-auto">
            {fetching && <p className="text-sm text-gray-500">Yükleniyor...</p>}
            {!fetching && sessions.length === 0 && (
              <p className="text-sm text-gray-500">Aktif fiş bulunamadı.</p>
            )}
            {sessions.map((s) => (
              <div
                key={s._id}
                className="border rounded-lg px-3 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {s.plateNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    Giriş: {formatDateTime(s.checkinAt)} ·{" "}
                    {s.checkinOperator?.name || "-"}
                  </p>
                </div>
                <Link
                  href={`/valet/checkout/${s._id}`}
                  className="text-sm bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-teal-700"
                >
                  Çıkış
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
