/**
 * Rotating word box ala referensi: kotak tint biru ber-border berisi
 * kata berganti (slide-up per ~2.2s, murni CSS).
 * Kata pertama diduplikasi di akhir agar loop mulus.
 */
export function RotatingWord({ words }: { words: string[] }) {
  const list = [...words, words[0]];
  return (
    <span className="inline-flex h-[1.15em] items-center overflow-hidden rounded-md2 border-2 border-blue-electric bg-blue-tint px-[0.25em] align-baseline leading-none">
      <span className="flex flex-col">
        {list.map((w, i) => (
          <span
            key={i}
            className="word-cycle block h-[1em] leading-[1em] text-blue-deep"
          >
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}
