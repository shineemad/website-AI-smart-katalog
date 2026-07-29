import { LogoMark } from "./logo";
import Link from "next/link";

/**
 * Split layout auth: panel kiri biru deep dengan headline putih raksasa
 * + ornamen isometrik, kanan area form putih.
 */
export function AuthShell({
  headline,
  accent,
  children,
}: {
  headline: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-blue-deep p-10 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-xl font-semibold uppercase tracking-tight text-white">
            Katalis
          </span>
          <span className="rounded-sm2 border border-blue-sky/60 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] leading-none text-blue-sky">
            AI
          </span>
        </Link>
        <div>
          <h1 className="font-display text-[clamp(2.4rem,4vw,4rem)] font-medium uppercase leading-[0.98] tracking-[-0.02em] text-white">
            {headline} <span className="text-blue-sky">{accent}</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Katalog produk elektronik dengan AI advisor yang menjawab dari
            spesifikasi asli.
          </p>
        </div>
        <svg
          viewBox="0 0 400 200"
          fill="none"
          className="pointer-events-none absolute -bottom-8 -right-8 w-[340px] opacity-25"
          aria-hidden
        >
          <g stroke="#7CB1FF" strokeWidth="1.5">
            <path d="M80 120 L180 70 L280 120 L180 170 Z" />
            <path d="M80 120 L80 135 L180 185 L280 135 L280 120" />
            <path d="M180 170 L180 185" />
            <path d="M290 50 L330 30 L370 50 L330 70 Z" />
            <path d="M290 50 L290 80 L330 100 L370 80 L370 50" />
          </g>
        </svg>
      </aside>
      <main className="flex items-center justify-center bg-white px-4 py-14 md:px-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
