"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import logo from "@/utils/logo.jpeg";

export const runtime = "nodejs";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Giriş başarısız. Bilgileri kontrol edin.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    if (role === "ADMIN" || role === "VIEWER") {
      router.replace("/admin");
    } else {
      router.replace("/valet");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/95 shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 relative">
            <Image
              src={logo}
              alt="Vale"
              fill
              sizes="64px"
              className="object-cover rounded-xl shadow"
              priority
            />
          </div>
          <p className="text-sm uppercase tracking-widest text-primary font-semibold">
            Vale Operatör Paneli
          </p>
          <h1 className="text-2xl font-bold mt-2 text-gray-900">Giriş Yap</h1>
          <p className="text-gray-500 text-sm">
            Admin veya vale hesabınızla oturum açın.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">E-posta</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary focus:ring-primary outline-none"
              placeholder="ornek@firma.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Şifre</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary focus:ring-primary outline-none"
              placeholder="••••••"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold hover:bg-teal-700 transition disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
        <div className="text-xs text-gray-500">
          Demo kullanıcıları: admin@example.com / admin123, valet@example.com /
          valet123
        </div>
      </div>
    </div>
  );
}
