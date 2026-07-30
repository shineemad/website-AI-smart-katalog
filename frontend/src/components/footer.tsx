import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-page px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-6">
            <Logo light />
            <p className="max-w-xs font-display text-2xl font-medium leading-snug text-white/90">
              Temukan lebih cepat.
              <br />
              Putuskan lebih cerdas.
            </p>
          </div>
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-white/50">
              Navigasi
            </p>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link href="/" className="hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/#katalog" className="hover:text-white">
                  Katalog
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Masuk
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  Daftar
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-white/50">
              Kategori
            </p>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>Laptop</li>
              <li>Smartphone</li>
              <li>Tablet</li>
              <li>Monitor</li>
              <li>Aksesoris</li>
            </ul>
          </div>
        </div>
        <p
          aria-hidden
          className="mt-16 select-none text-center font-display text-[clamp(3.5rem,13vw,10rem)] font-semibold uppercase leading-none tracking-[-0.03em] text-white/[0.07]"
        >
          Katalis
        </p>
        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <span>© 2026 KATALIS AI. Katalog yang berpikir.</span>
          <span className="font-mono">Ditenagai Ollama + MongoDB + MinIO</span>
        </div>
      </div>
    </footer>
  );
}
