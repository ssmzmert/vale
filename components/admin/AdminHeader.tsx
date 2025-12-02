"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import logo from "@/utils/logo.jpeg";

const links = [
  { href: "/admin", label: "Dashboard", roles: ["ADMIN", "VIEWER"] as const },
  { href: "/admin/pricing", label: "Ücret Formu", roles: ["ADMIN"] as const },
  { href: "/admin/storage", label: "Depolama", roles: ["ADMIN"] as const },
  { href: "/admin/mekanlar", label: "Mekanlar", roles: ["ADMIN"] as const },
  { href: "/admin/users", label: "Kullanıcılar", roles: ["ADMIN"] as const }
];

export function AdminHeader({
  title,
  subtitle,
  userRole = "ADMIN"
}: {
  title: string;
  subtitle?: string;
  userRole?: "ADMIN" | "VALET" | "VIEWER";
}) {
  const pathname = usePathname();

  return (
    <div className="bg-white shadow-sm rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {links
          .filter((link) => link.roles.includes(userRole as any))
          .map((link) => {
          const active = pathname === link.href;
          const baseClasses =
            "px-3 py-2 rounded-lg border text-sm transition-colors inline-flex items-center";
          const activeClasses = active
            ? "bg-primary text-white border-primary"
            : "text-gray-700 hover:bg-gray-100";
          return (
            <Link key={link.href} href={link.href} className={`${baseClasses} ${activeClasses}`}>
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/giris" })}
          className="px-3 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Çıkış
        </button>
      </div>
    </div>
  );
}
