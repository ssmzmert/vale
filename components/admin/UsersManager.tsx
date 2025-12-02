"use client";

import { useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VALET" | "VIEWER";
  active: boolean;
}

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "VALET",
    password: "gecici123"
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setLoading(false);
    if (res.ok) {
      setForm({ name: "", email: "", role: "VALET", password: "gecici123" });
      load();
    } else {
      alert("Kullanıcı oluşturulamadı");
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active })
    });
    load();
  };

  const resetPassword = async (id: string) => {
    const yeni = prompt("Yeni şifreyi girin");
    if (!yeni) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: yeni })
    });
    alert("Şifre güncellendi");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-gray-500">Yeni kullanıcı ekleyin veya durumunu güncelleyin.</p>
        </div>
        <form onSubmit={createUser} className="grid md:grid-cols-4 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            placeholder="Ad Soyad"
            className="border rounded-lg px-3 py-2"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            type="email"
            placeholder="E-posta"
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="ADMIN">Admin</option>
            <option value="VALET">Vale</option>
            <option value="VIEWER">Dashboard</option>
          </select>
          <input
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            placeholder="Geçici Şifre"
            className="border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-4 bg-primary text-white rounded-lg py-2 font-semibold disabled:opacity-60"
          >
            {loading ? "Kaydediliyor..." : "Kullanıcı Oluştur"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Kullanıcılar</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Ad</th>
                <th className="py-2">E-posta</th>
                <th className="py-2">Rol</th>
                <th className="py-2">Durum</th>
                <th className="py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {u.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="py-2 flex gap-2">
                    <button
                      onClick={() => toggleActive(u._id, !u.active)}
                      className="text-primary"
                    >
                      {u.active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                    <button onClick={() => resetPassword(u._id)} className="text-gray-600">
                      Şifre Sıfırla
                    </button>
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
