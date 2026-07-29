/** Eyebrow barcode ala referensi: |||||  LABEL  ||||| (mono, uppercase). */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow-bars flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-gray-muted">
      <span>{children}</span>
    </p>
  );
}

/** Varian rata kiri untuk header section non-center. */
export function EyebrowLeft({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow-bars flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-gray-muted">
      <span>{children}</span>
    </p>
  );
}
