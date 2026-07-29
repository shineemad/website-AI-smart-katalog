import Link from "next/link";

/** Logomark KATALIS: bar barcode/soundwave dalam kotak biru. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className="shrink-0"
    >
      <rect width="64" height="64" rx="14" fill="#1916B0" />
      <rect
        x="14"
        y="24"
        width="4.5"
        height="16"
        rx="2.25"
        fill="#FFFFFF"
        opacity="0.85"
      />
      <rect x="22.5" y="17" width="4.5" height="30" rx="2.25" fill="#FFFFFF" />
      <rect x="31" y="10" width="4.5" height="44" rx="2.25" fill="#7CB1FF" />
      <rect x="39.5" y="17" width="4.5" height="30" rx="2.25" fill="#FFFFFF" />
      <rect
        x="48"
        y="24"
        width="4.5"
        height="16"
        rx="2.25"
        fill="#FFFFFF"
        opacity="0.85"
      />
    </svg>
  );
}

/** Logo lengkap: mark + wordmark + badge AI. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark />
      <span
        className={`font-display text-xl font-semibold uppercase tracking-tight ${
          light ? "text-white" : "text-ink"
        }`}
      >
        Katalis
      </span>
      <span className="rounded-sm2 border border-blue-electric bg-blue-tint px-1.5 py-0.5 font-mono text-[11px] leading-none text-blue-deep">
        AI
      </span>
    </Link>
  );
}
