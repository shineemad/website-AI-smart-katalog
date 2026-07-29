/**
 * Marquee CTA: strip teks berjalan horizontal (loop CSS).
 * Konten diduplikasi agar loop -50% mulus. Max SATU per halaman.
 */
export function Marquee({ text }: { text: string }) {
  const items = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className="mx-8 inline-flex items-center gap-3">
      {text}
      <span aria-hidden className="text-blue-sky">
        →
      </span>
    </span>
  ));
  return (
    <div className="overflow-hidden whitespace-nowrap" aria-hidden>
      <div className="marquee-track inline-block font-display text-2xl font-medium uppercase tracking-tight text-white/90 md:text-4xl">
        {items}
        {items}
      </div>
    </div>
  );
}
