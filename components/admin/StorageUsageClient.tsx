"use client";

import { useEffect, useState } from "react";

interface StorageUsage {
  usedBytes: number;
  maxBytes: number;
}

function formatMB(bytes: number) {
  return Number((bytes / (1024 * 1024)).toFixed(1));
}

export function StorageUsageClient() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsage = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/storage", { cache: "no-store" });
    const json = await res.json();
    setUsage(json.storageUsage);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const percent =
    usage && usage.maxBytes > 0
      ? Math.min(
          100,
          Math.round((usage.usedBytes / usage.maxBytes) * 1000) / 10
        )
      : 0;

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Veritabanı depolama</p>
          <p className="text-2xl font-bold">
            {formatMB(usage?.usedBytes || 0)} /{" "}
            {formatMB(usage?.maxBytes || 500 * 1024 * 1024)} MB
          </p>
          <p className="text-xs text-gray-500 mt-1">Maksimum 500 MB</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {loading ? "Yükleniyor..." : `${percent}%`}
          </span>
          <button
            onClick={fetchUsage}
            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
            disabled={loading}
          >
            Yenile
          </button>
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
