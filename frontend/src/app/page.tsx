"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Eyebrow } from "@/components/eyebrow";
import { Reveal } from "@/components/reveal";
import { Marquee } from "@/components/marquee";
import { RotatingWord } from "@/components/rotating-word";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { api, ApiError, Product, ProductListResponse } from "@/lib/api";

const CATEGORIES = ["Laptop", "Smartphone", "Tablet", "Monitor", "Aksesoris"];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Catalog />
        <HowItWorks />
        <BottomCta />
      </main>
      <Footer />
    </>
  );
}

/* ---------------- Hero + Global AI Search (Asymmetric Split) ---------------- */

function Hero() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reply: string;
    products: Product[];
  } | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    // Visual hero: live preview kartu produk asli dari API (bukan mockup)
    api
      .listProducts({ limit: 2 })
      .then((res) => setFeatured(res.data))
      .catch(() => setFeatured([]));
  }, []);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.aiSearch(query.trim());
      setResult({ reply: res.reply, products: res.products });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 429
          ? "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi."
          : "AI sedang tidak bisa dihubungi. Coba beberapa saat lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-page px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Kolom kiri: copy + AI search */}
          <div>
            <div
              className="rise"
              style={{ "--rise-delay": "0ms" } as React.CSSProperties}
            >
              <div className="flex justify-start">
                <Eyebrow>Smart Catalog</Eyebrow>
              </div>
            </div>
            <h1
              className="rise mt-6 font-display text-[clamp(1.9rem,3.2vw,3rem)] font-medium uppercase leading-[1.02] tracking-[-0.02em] text-ink"
              style={{ "--rise-delay": "90ms" } as React.CSSProperties}
            >
              Temukan <span className="text-blue-deep">produk</span> yang
              <br />
              tepat dengan AI.
            </h1>
            <p
              className="rise mt-5 max-w-lg text-base leading-relaxed text-gray2 md:text-lg"
              style={{ "--rise-delay": "180ms" } as React.CSSProperties}
            >
              Ceritakan kebutuhanmu, AI kami membaca seluruh katalog dan memberi
              rekomendasi terbaik.
            </p>

            <form
              onSubmit={ask}
              className="rise mt-8 flex flex-col gap-3 sm:flex-row"
              style={{ "--rise-delay": "270ms" } as React.CSSProperties}
            >
              <label htmlFor="ai-query" className="sr-only">
                Pertanyaan untuk AI
              </label>
              <input
                id="ai-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: laptop di bawah 10 juta untuk desain grafis"
                maxLength={500}
                className="h-14 flex-1 rounded-md2 border border-lavender bg-white px-5 text-[15px] text-ink placeholder:text-gray-faint focus:border-blue-deep focus:outline-none focus:ring-2 focus:ring-blue-electric/30"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="arrow-btn h-14 shrink-0 rounded-md2 bg-blue-deep px-7 text-[15px] font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Berpikir..." : "Tanya AI"}{" "}
                {!loading && <span className="arrow">→</span>}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-md2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          {/* Kolom kanan: visual cluster (kartu produk asli, offset diagonal) */}
          <div
            className="rise relative hidden min-h-[440px] lg:block"
            style={{ "--rise-delay": "360ms" } as React.CSSProperties}
          >
            <div
              aria-hidden
              className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-xl2 bg-blue-tint"
            />
            <IsometricOrnament className="pointer-events-none absolute -right-6 -top-2 w-[300px] opacity-70" />
            {featured[0] && (
              <div className="absolute left-2 top-8 w-[250px] -rotate-3 transition-transform duration-300 hover:rotate-0">
                <ProductCard product={featured[0]} />
              </div>
            )}
            {featured[1] && (
              <div className="absolute bottom-0 right-6 w-[250px] rotate-2 transition-transform duration-300 hover:rotate-0">
                <ProductCard product={featured[1]} />
              </div>
            )}
            {featured.length === 0 && (
              <div className="absolute left-2 top-8 w-[250px] -rotate-3">
                <ProductCardSkeleton />
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="mt-10 rounded-lg2 border border-lavender bg-bg-soft p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-blue-deep">
              Rekomendasi AI
            </p>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {result.reply}
            </p>
            {result.products.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {result.products.slice(0, 8).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Katalog + filter + pagination ---------------- */

const PRICE_RANGES = [
  { label: "Semua harga", min: undefined, max: undefined },
  { label: "Di bawah Rp 2 jt", min: undefined, max: 2_000_000 },
  { label: "Rp 2 jt - 8 jt", min: 2_000_000, max: 8_000_000 },
  { label: "Rp 8 jt - 15 jt", min: 8_000_000, max: 15_000_000 },
  { label: "Di atas Rp 15 jt", min: 15_000_000, max: undefined },
] as const;

function Catalog() {
  const [category, setCategory] = useState<string>("");
  const [rangeIdx, setRangeIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = PRICE_RANGES[rangeIdx];
      const res = await api.listProducts({
        category: category || undefined,
        minPrice: range.min,
        maxPrice: range.max,
        page,
        limit: 12,
      });
      setData(res);
    } catch {
      setError("Gagal memuat katalog. Pastikan server API berjalan.");
    } finally {
      setLoading(false);
    }
  }, [category, rangeIdx, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total / 12)) : 1;

  return (
    <section id="katalog" className="bg-lavender/50">
      <div className="mx-auto max-w-page px-4 py-16 md:px-6 md:py-24">
        <h2 className="sr-only">Katalog produk</h2>
        <Reveal>
          <div className="rounded-xl2 border border-lavender bg-white p-5 md:p-10">
            {/* Selector besar ala storefront: Kategori + Rentang Harga */}
            <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
              <div>
                <label
                  htmlFor="f-category"
                  className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-muted"
                >
                  Kategori
                </label>
                <div className="relative mt-1">
                  <select
                    id="f-category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    className="cursor-pointer appearance-none bg-transparent pr-9 font-display text-3xl font-semibold tracking-tight text-ink focus:outline-none md:text-4xl"
                  >
                    <option value="">Semua</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-xl text-gray-muted"
                  >
                    ⌄
                  </span>
                </div>
              </div>
              <div>
                <label
                  htmlFor="f-range"
                  className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-muted"
                >
                  Rentang harga
                </label>
                <div className="relative mt-1">
                  <select
                    id="f-range"
                    value={rangeIdx}
                    onChange={(e) => {
                      setRangeIdx(Number(e.target.value));
                      setPage(1);
                    }}
                    className="cursor-pointer appearance-none bg-transparent pr-9 font-display text-3xl font-semibold tracking-tight text-blue-deep focus:outline-none md:text-4xl"
                  >
                    {PRICE_RANGES.map((r, i) => (
                      <option key={r.label} value={i}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-xl text-gray-muted"
                  >
                    ⌄
                  </span>
                </div>
              </div>
              {data && (
                <p className="ml-auto hidden font-mono text-xs tabular-nums text-gray-muted md:block">
                  {data.meta.total} produk
                </p>
              )}
            </div>

            <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-muted">
              Semua produk
            </p>

            {error && (
              <p className="mt-4 rounded-md2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))
                : data?.data.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
            </div>

            {!loading && data && data.data.length === 0 && (
              <div className="mt-6 rounded-lg2 border border-lavender bg-bg-soft p-12 text-center">
                <p className="font-display text-xl font-medium text-ink">
                  Tidak ada produk yang cocok.
                </p>
                <p className="mt-2 text-sm text-gray2">
                  Coba longgarkan filter kategori atau rentang harga.
                </p>
              </div>
            )}

            {!loading && data && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-10 w-10 rounded-md2 font-mono text-sm tabular-nums transition-colors ${
                        n === page
                          ? "bg-blue-deep text-white"
                          : "border border-lavender bg-white text-gray2 hover:border-blue-deep hover:text-blue-deep"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Cara kerja: numbered steps ---------------- */

const STEPS = [
  {
    no: "01",
    title: "Jelajahi katalog",
    body: "Saring produk berdasarkan kategori dan rentang harga sesuai kebutuhanmu.",
  },
  {
    no: "02",
    title: "Tanya AI",
    body: "Tanyakan apa saja tentang produk, AI menjawab berdasarkan spesifikasi asli.",
  },
  {
    no: "03",
    title: "Putuskan dengan yakin",
    body: "Bandingkan rekomendasi dan pilih produk yang paling tepat untukmu.",
  },
] as const;

function HowItWorks() {
  return (
    <section id="cara-kerja" className="bg-white">
      <div className="mx-auto max-w-page px-4 py-20 md:px-6 md:py-28">
        <Reveal>
          <h2 className="max-w-2xl font-display text-[clamp(1.8rem,4vw,3rem)] font-medium tracking-tight text-ink">
            Dari bingung ke yakin, dalam tiga langkah.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 110}>
              <div className="group h-full rounded-lg2 border border-lavender bg-white p-7 transition-colors duration-200 hover:border-blue-deep hover:bg-blue-tint/40">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md2 bg-blue-tint font-mono text-lg font-semibold tabular-nums text-blue-deep transition-colors duration-200 group-hover:bg-blue-deep group-hover:text-white">
                  {s.no}
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-2.5 max-w-[36ch] text-sm leading-relaxed text-gray2">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA bawah: rotating word + marquee ---------------- */

function BottomCta() {
  return (
    <section className="bg-bg-soft pb-20 md:pb-28">
      <div className="mx-auto max-w-page px-4 md:px-6">
        <div className="overflow-hidden rounded-xl2 bg-blue-deep">
          <div className="px-6 pb-10 pt-14 text-center md:px-16 md:pt-20">
            <h2 className="mx-auto max-w-4xl font-display text-[clamp(2rem,5.5vw,4.2rem)] font-medium uppercase leading-[1.02] tracking-[-0.02em] text-white">
              Siap menemukan{" "}
              <RotatingWord
                words={[
                  "laptop",
                  "smartphone",
                  "tablet",
                  "monitor",
                  "aksesoris",
                ]}
              />{" "}
              terbaikmu?
            </h2>
            <a
              href="#katalog"
              className="arrow-btn mt-10 inline-block rounded-md2 bg-white px-8 py-4 text-[15px] font-semibold text-blue-deep transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Jelajahi katalog <span className="arrow">→</span>
            </a>
          </div>
          <div className="border-t border-white/15 py-5">
            <Marquee text="Katalog yang berpikir" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Ornamen isometrik wireframe ---------------- */

function IsometricOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" fill="none" className={className} aria-hidden>
      <g stroke="#E0E0EB" strokeWidth="1.5">
        <path d="M80 180 L180 130 L280 180 L180 230 Z" />
        <path d="M80 180 L80 195 L180 245 L280 195 L280 180" />
        <path d="M180 230 L180 245" />
        <path d="M110 165 L180 130 L250 165 L180 200 Z" opacity="0.7" />
        <path d="M290 90 L340 65 L390 90 L340 115 Z" />
        <path d="M290 90 L290 130 L340 155 L390 130 L390 90" />
        <path d="M340 115 L340 155" />
        <path d="M315 77 L365 102" opacity="0.6" />
        <rect
          x="40"
          y="60"
          width="46"
          height="86"
          rx="8"
          transform="rotate(-12 40 60)"
        />
        <line x1="52" y1="128" x2="72" y2="124" opacity="0.6" />
      </g>
    </svg>
  );
}
