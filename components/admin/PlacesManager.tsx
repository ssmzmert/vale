"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Place = {
  _id: string;
  name: string;
  active?: boolean;
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: "VALET" | "VIEWER";
  active: boolean;
  place?: { _id: string; name?: string } | null;
};

export function PlacesManager() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPlace, setNewPlace] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/places", { cache: "no-store" });
    if (!res.ok) {
      setPlaces([]);
      setUsers([]);
      return;
    }
    const data = await res.json();
    setPlaces(data.places || []);
    setUsers(data.users || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createPlace = async (e: FormEvent) => {
    e.preventDefault();
    const name = newPlace.trim();
    if (!name) return;
    setLoading(true);
    const res = await fetch("/api/admin/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setLoading(false);
    if (res.ok) {
      setNewPlace("");
      load();
    } else {
      const data = await res.json();
      alert(data.error || "Mekan oluşturulamadı");
    }
  };

  const assignUser = async (userId: string, placeId: string | null) => {
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, placeId })
    });
    setLoading(false);
    if (!res.ok) {
      alert("Atama güncellenemedi");
      return;
    }
    load();
  };

  const placeAssignments = useMemo(() => {
    const map: Record<string, { valets: User[]; viewers: User[] }> = {};
    places.forEach((p) => {
      map[p._id] = { valets: [], viewers: [] };
    });
    users.forEach((u) => {
      const pid = u.place?._id;
      if (pid && map[pid]) {
        if (u.role === "VALET") map[pid].valets.push(u);
        if (u.role === "VIEWER") map[pid].viewers.push(u);
      }
    });
    return map;
  }, [places, users]);

  const unassigned = users.filter((u) => !u.place?._id);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Yeni Mekan</h2>
            <p className="text-sm text-gray-500">Mekan ekleyip vale veya izleyici atayın.</p>
          </div>
          <span className="text-sm text-gray-500">{places.length} mekan</span>
        </div>
        <form onSubmit={createPlace} className="flex flex-col md:flex-row gap-3">
          <input
            value={newPlace}
            onChange={(e) => setNewPlace(e.target.value)}
            placeholder="Mekan adı"
            className="border rounded-lg px-3 py-2 flex-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-60"
          >
            {loading ? "Kaydediliyor..." : "Ekle"}
          </button>
        </form>
        {unassigned.length > 0 && (
          <p className="text-sm text-gray-600">
            Atanmamış kullanıcılar: {unassigned.map((u) => u.name).join(", ")}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mekan Listesi</h3>
          <span className="text-sm text-gray-500">Vale veya izleyici atamalarını takip edin.</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {places.map((place) => {
            const assign = placeAssignments[place._id] || { valets: [], viewers: [] };
            return (
              <div key={place._id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{place.name}</h4>
                    <p className="text-xs text-gray-500">{place.active ? "Aktif" : "Pasif"}</p>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {assign.valets.length} vale · {assign.viewers.length} izleyici
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-800">Valeler</p>
                  <div className="flex flex-wrap gap-2">
                    {assign.valets.length === 0 && (
                      <span className="text-xs text-gray-500">Atama yok</span>
                    )}
                    {assign.valets.map((u) => (
                      <span
                        key={u._id}
                        className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                      >
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-800">İzleyiciler</p>
                  <div className="flex flex-wrap gap-2">
                    {assign.viewers.length === 0 && (
                      <span className="text-xs text-gray-500">Atama yok</span>
                    )}
                    {assign.viewers.map((u) => (
                      <span
                        key={u._id}
                        className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                      >
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {places.length === 0 && (
            <div className="col-span-2 text-sm text-gray-500">Henüz tanımlı mekan yok.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Kullanıcı Atamaları</h3>
          <p className="text-sm text-gray-500">Her kullanıcı yalnızca bir mekana atanabilir.</p>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Ad</th>
                <th className="py-2">E-posta</th>
                <th className="py-2">Rol</th>
                <th className="py-2">Durum</th>
                <th className="py-2">Mekan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.role === "VALET" ? "Vale" : "Viewer"}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {u.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="py-2">
                    <select
                      value={u.place?._id || ""}
                      disabled={loading}
                      onChange={(e) => assignUser(u._id, e.target.value || null)}
                      className="border rounded-lg px-2 py-1"
                    >
                      <option value="">— Atanmamış —</option>
                      {places.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.active ? "" : "(pasif)"}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
