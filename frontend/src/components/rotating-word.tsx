/**
 * Rotating word box ala referensi: kotak tint biru ber-border berisi
 * kata berganti (slide-up per ~2.2s, murni CSS).
 * Kata pertama diduplikasi di akhir agar loop mulus.
 */
export function RotatingWord({ words }: { words: string[] }) {
  const list = [...words, words[0]];
  return (
    <span
      className="inline-flex items-center overflow-hidden rounded-md2 border-2 border-blue-electric bg-blue-tint px-[0.25em] py-[0.08em] align-middle leading-none"
      aria-label={words[0]}
    >
      <span aria-hidden className="block h-[1em] overflow-hidden">
        <span className="word-cycle flex flex-col">
          {list.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="block h-[1em] shrink-0 whitespace-nowrap leading-[1em] text-blue-deep"
            >
              {word}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
