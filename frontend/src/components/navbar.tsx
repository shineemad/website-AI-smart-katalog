"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./logo";

/**
 * Navbar putih satu baris (tinggi 68px) + announcement bar biru di atasnya.
 */
export function Navbar() {
  const { token, role, email, ready, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-blue-deep px-4 py-2 text-center font-mono text-xs tracking-wide text-white">
        BARU: Tanya AI untuk rekomendasi produk terbaik
      </div>
      <nav className="border-b border-lavender bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[68px] max-w-page items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2 md:gap-5">
            <Link
              href="/#katalog"
              className="hidden text-sm font-medium text-gray2 transition-colors hover:text-ink md:block"
            >
              Katalog
            </Link>
            <Link
              href="/#cara-kerja"
              className="hidden text-sm font-medium text-gray2 transition-colors hover:text-ink md:block"
            >
              Cara Kerja
            </Link>
            {ready && role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-blue-deep hover:underline"
              >
                Admin
              </Link>
            )}
            {ready && token ? (
              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-xs text-gray-muted lg:block">
                  {email}
                </span>
                <button
                  onClick={logout}
                  className="rounded-md2 border border-lavender px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-blue-deep hover:text-blue-deep active:scale-[0.98]"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="arrow-btn rounded-md2 bg-blue-deep px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.98]"
              >
                Masuk <span className="arrow">→</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
