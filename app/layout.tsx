import "./globals.css";
import { Providers } from "@/components/providers";
import { Manrope } from "next/font/google";
import type { Metadata } from "next";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vale Operatör",
  description: "Vale otopark yönetim paneli"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={manrope.className}>
        <Providers>
          <div className="min-h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
