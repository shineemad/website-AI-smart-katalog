"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ChatCircleDots,
  DeviceMobile,
  DeviceTablet,
  Headphones,
  Laptop,
  MagnifyingGlass,
  Monitor,
  ShieldCheck,
} from "@phosphor-icons/react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { RotatingWord } from "@/components/rotating-word";
import { AiText } from "@/components/ai-text";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { api, ApiError, Product, ProductListResponse } from "@/lib/api";

const CATEGORIES = ["Laptop", "Smartphone", "Tablet", "Monitor", "Aksesoris"];

/* Saran satu-klik di hero: bukti AI tanpa harus mengetik */
const HERO_SUGGESTIONS = [
  "Laptop untuk mahasiswa desain grafis",
  "HP kamera terbaik di bawah 5 juta",
  "Monitor kerja di bawah 2 juta",
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Alur konversi: hook AI → trust → nilai → cara kerja →
           eksplorasi → produk → bukti dashboard → keberatan → aksi */}
        <Hero />
        <BrandWall />
        <FeatureBento />
        <HowItWorks />
        <CategoryTiles />
        <Catalog />
        <DashboardShowcase />
        <Faq />
        <BottomCta />
      </main>
      <Footer />
    </>
  );
}

/* ---------------- Hero manifesto terpusat + Global AI Search ---------------- */

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reply: string;
    products: Product[];
  } | null>(null);

  /* GSAP: timeline entrance + parallax scrub + ambient float.
     CSS keyframe hero dinonaktifkan via [data-hero-gsap] agar tidak dobel. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    section.dataset.heroGsap = "true";
    let observer: MutationObserver | undefined;
    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>(".hero-line", section);
      const search = section.querySelector(".hero-search-enter");
      const chips = section.querySelector("[data-hero-chips]");
      const artL = section.querySelector(".hero-ornament-art-left");
      const artR = section.querySelector(".hero-ornament-art-right");

      /* y: 0 menolkan offset px hasil parse transform CSS awal (112% => px) */
      gsap.set(lines, { y: 0, yPercent: 112, rotate: 1.4, opacity: 1 });
      gsap.set(search, { opacity: 0, y: 24, scaleX: 0.92 });
      gsap.set(chips, { opacity: 0, y: 14 });
      gsap.set(artL, { opacity: 0, x: -52, y: 18, rotate: -2 });
      gsap.set(artR, { opacity: 0, x: 52, y: 18, rotate: 2 });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "expo.out" },
      });
      tl.to(lines, { yPercent: 0, rotate: 0, duration: 1, stagger: 0.09 })
        .to(search, { opacity: 1, y: 0, scaleX: 1, duration: 0.9 }, 0.26)
        .to(chips, { opacity: 1, y: 0, duration: 0.6 }, 0.48)
        .to(artL, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 1.1 }, 0.12)
        .to(artR, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 1.1 }, 0.2)
        .add(() => {
          /* Lepas inline transform GSAP agar hover CSS pill bisa mengambil alih */
          gsap.set(search, { clearProps: "transform,translate,scale,opacity" });
          /* Ambient float: hero tetap hidup setelah entrance selesai */
          gsap.to(artL, {
            y: 10,
            rotate: -1.2,
            duration: 3.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
          gsap.to(artR, {
            y: -10,
            rotate: 1.2,
            duration: 3.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });

      /* Tunggu preloader selesai (data-katalis-ready) sebelum play */
      if (document.documentElement.dataset.katalisReady === "true") {
        tl.play();
      } else {
        observer = new MutationObserver(() => {
          if (document.documentElement.dataset.katalisReady === "true") {
            observer?.disconnect();
            tl.play();
          }
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-katalis-ready"],
        });
      }

      /* Parallax scrub ornamen, hanya desktop (ornamen hidden < lg) */
      mm.add("(min-width: 1024px)", () => {
        const wrapL = section.querySelector(".hero-ornament-left");
        const wrapR = section.querySelector(".hero-ornament-right");
        gsap.to(wrapL, {
          y: 120,
          rotate: -3,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=760",
            scrub: true,
          },
        });
        gsap.to(wrapR, {
          y: 170,
          rotate: 4,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=760",
            scrub: true,
          },
        });
      });

      /* Magnetic hover tombol Tanya AI: feedback aksi utama (pola sama dengan navbar) */
      mm.add("(hover: hover) and (pointer: fine)", () => {
        const cta = section.querySelector<HTMLElement>("[data-hero-cta]");
        if (!cta) return;
        const moveX = gsap.quickTo(cta, "x", {
          duration: 0.48,
          ease: "power3.out",
        });
        const moveY = gsap.quickTo(cta, "y", {
          duration: 0.48,
          ease: "power3.out",
        });
        const pointerMove = (event: PointerEvent) => {
          const bounds = cta.getBoundingClientRect();
          moveX((event.clientX - (bounds.left + bounds.width / 2)) * 0.12);
          moveY((event.clientY - (bounds.top + bounds.height / 2)) * 0.16);
        };
        const pointerLeave = () => {
          moveX(0);
          moveY(0);
        };
        cta.addEventListener("pointermove", pointerMove);
        cta.addEventListener("pointerleave", pointerLeave);
        return () => {
          cta.removeEventListener("pointermove", pointerMove);
          cta.removeEventListener("pointerleave", pointerLeave);
        };
      });
    }, section);

    return () => {
      observer?.disconnect();
      mm.revert();
      ctx.revert();
      delete section.dataset.heroGsap;
    };
  }, []);

  async function runQuery(q: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.aiSearch(q);
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

  function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    runQuery(query.trim());
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white">
      {/* Ornamen isometrik besar kiri-kanan ala referensi */}
      <div className="hero-ornament hero-ornament-left pointer-events-none absolute -left-24 top-6 hidden w-[440px] lg:block">
        <HeroOrnamentLeft className="hero-ornament-art hero-ornament-art-left w-full" />
      </div>
      <div className="hero-ornament hero-ornament-right pointer-events-none absolute -right-14 top-10 hidden w-[340px] lg:block">
        <HeroOrnamentRight className="hero-ornament-art hero-ornament-art-right w-full" />
      </div>

      <div className="relative mx-auto max-w-page px-4 pb-14 pt-14 md:px-6 md:pb-20 md:pt-20">
        <h1
          aria-label="Temukan produk yang tepat dengan AI."
          className="mx-auto max-w-4xl text-center font-display text-[clamp(2.3rem,5.8vw,4.5rem)] font-medium uppercase leading-[1] tracking-[-0.025em] text-ink"
        >
          <span className="hero-line-mask">
            <span
              className="hero-line"
              style={{ "--hero-delay": "100ms" } as React.CSSProperties}
            >
              Temukan <span className="text-blue-deep">produk</span> yang
            </span>
          </span>
          <span className="hero-line-mask">
            <span
              className="hero-line"
              style={{ "--hero-delay": "190ms" } as React.CSSProperties}
            >
              tepat dengan AI.
            </span>
          </span>
        </h1>

        <form
          onSubmit={ask}
          className="hero-search-enter hero-search-pill mx-auto mt-9 flex w-full max-w-xl items-center gap-2 rounded-full border border-lavender bg-white p-1.5 pl-2"
        >
          <label htmlFor="ai-query" className="sr-only">
            Pertanyaan untuk AI
          </label>
          <input
            id="ai-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mau cari apa hari ini?"
            maxLength={500}
            className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[15px] text-ink placeholder:text-gray-faint focus:outline-none"
          />
          <button
            type="submit"
            data-hero-cta
            disabled={loading || !query.trim()}
            className="arrow-btn motion-button h-12 shrink-0 rounded-full bg-blue-deep px-6 text-[15px] font-semibold text-white transition-colors hover:bg-blue-electric disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Berpikir..." : "Tanya AI"}{" "}
            {!loading && <span className="arrow">→</span>}
          </button>
        </form>

        {/* Saran satu-klik: jalur tercepat melihat AI bekerja */}
        <div
          data-hero-chips
          className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2"
        >
          {HERO_SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuery(q);
                runQuery(q);
              }}
              className="rounded-full border border-lavender bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray2 transition-colors hover:border-blue-deep hover:text-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {error && (
          <p className="mx-auto mt-4 max-w-xl rounded-md2 border border-danger/30 bg-danger/5 px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-10 rounded-lg2 border border-lavender bg-bg-soft p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-blue-deep">
              Rekomendasi AI
            </p>
            <AiText
              text={result.reply}
              className="mt-3 text-[15px] leading-relaxed text-ink-soft"
            />
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

/* ---------------- Logo wall brand elektronik (di bawah hero) ---------------- */

const BRANDS = [
  { slug: "apple", name: "Apple" },
  { slug: "samsung", name: "Samsung" },
  { slug: "asus", name: "ASUS" },
  { slug: "acer", name: "Acer" },
  { slug: "lenovo", name: "Lenovo" },
  { slug: "xiaomi", name: "Xiaomi" },
  { slug: "lg", name: "LG" },
] as const;

function BrandWall() {
  const logos = (hidden = false) => (
    <div
      aria-hidden={hidden || undefined}
      className="brand-logo-set flex items-center justify-around gap-8 px-4 md:gap-12 md:px-8"
    >
      {BRANDS.map((brand) => (
        <span
          key={brand.slug}
          className="flex h-8 w-20 shrink-0 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://cdn.simpleicons.org/${brand.slug}/9797A6`}
            alt={hidden ? "" : brand.name}
            className="brand-mark max-h-7 max-w-16 opacity-70 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0"
            loading="lazy"
          />
        </span>
      ))}
    </div>
  );

  return (
    <section
      aria-label="Brand yang tersedia di katalog"
      className="overflow-hidden bg-white"
    >
      <div className="mx-auto max-w-page px-4 pb-16 md:px-6 md:pb-20">
        <Reveal delay={80}>
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-gray-muted">
            Brand pilihan di katalog
          </p>
          <div className="brand-logo-rail mt-7 overflow-hidden">
            <div className="brand-logo-track flex w-max items-center">
              {logos()}
              {logos(true)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Kategori pintasan: bento asimetris ---------------- */

const CATEGORY_ICONS = {
  Laptop: Laptop,
  Smartphone: DeviceMobile,
  Tablet: DeviceTablet,
  Monitor: Monitor,
  Aksesoris: Headphones,
} as const;

function CategoryTiles() {
  const sectionRef = useRef<HTMLElement>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .listProducts({ limit: 50 })
      .then((res) => {
        const c: Record<string, number> = {};
        const im: Record<string, string> = {};
        res.data.forEach((p) => {
          c[p.category] = (c[p.category] ?? 0) + 1;
          if (!im[p.category] && p.imageUrl) im[p.category] = p.imageUrl;
        });
        setCounts(c);
        setImages(im);
      })
      .catch(() => setCounts({}));
  }, []);

  /* GSAP: entrance stagger baris indeks + count-up angka produk saat
     section masuk. Menekankan hierarki dan data nyata, sekali jalan. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-cat-row]", section);
      const counters = gsap.utils.toArray<HTMLElement>(
        "[data-cat-count]",
        section,
      );

      gsap.set(rows, { y: 44, opacity: 0 });

      const preview = section.querySelector("[data-cat-preview]");
      if (preview) gsap.set(preview, { y: 36, opacity: 0 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 72%",
        once: true,
        onEnter: () => {
          gsap.to(rows, {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "expo.out",
            stagger: 0.09,
          });
          if (preview) {
            gsap.to(preview, {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "expo.out",
              delay: 0.1,
            });
          }
          counters.forEach((el) => {
            const target = Number(el.dataset.catCount ?? "0");
            gsap.fromTo(
              el,
              { textContent: 0 },
              {
                textContent: target,
                duration: 1.1,
                ease: "power2.out",
                snap: { textContent: 1 },
              },
            );
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, [counts]);

  /* Pinned scan (desktop): section terkunci di puncak viewport, scroll
     memindai baris kategori satu per satu sebelum halaman lanjut.
     Storytelling sekuensial: satu kategori, satu momen fokus.
     Effect terpisah agar pin tidak ikut mati saat data produk tiba. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const buttons = gsap.utils.toArray<HTMLElement>(".cat-row", section);
      const frames = gsap.utils.toArray<HTMLElement>("[data-cat-img]", section);
      if (buttons.length === 0) return;

      /* Crossfade panel gambar mengikuti kategori aktif (state transition) */
      const showFrame = (idx: number) => {
        frames.forEach((f, i) => {
          f.dataset.show = i === idx ? "true" : "false";
        });
      };

      const paint = (activeIdx: number) => {
        buttons.forEach((b, i) => {
          b.dataset.state =
            i < activeIdx ? "visited" : i === activeIdx ? "active" : "upcoming";
        });
        showFrame(activeIdx);
      };

      buttons.forEach((b) => {
        b.dataset.state = "upcoming";
      });

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () =>
          `+=${Math.round(window.innerHeight * buttons.length * 0.45)}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          paint(
            Math.min(
              buttons.length - 1,
              Math.floor(self.progress * buttons.length),
            ),
          );
        },
        onLeave: () => {
          buttons.forEach((b) => {
            b.dataset.state = "visited";
          });
          showFrame(buttons.length - 1);
        },
        onLeaveBack: () => {
          buttons.forEach((b) => {
            b.dataset.state = "upcoming";
          });
          showFrame(0);
        },
      });

      return () => {
        st.kill();
        buttons.forEach((b) => {
          delete b.dataset.state;
        });
        frames.forEach((f, i) => {
          f.dataset.show = i === 0 ? "true" : "false";
        });
      };
    });

    return () => mm.revert();
  }, []);

  function pick(cat: string) {
    window.dispatchEvent(new CustomEvent("katalis:category", { detail: cat }));
    document
      .getElementById("katalog")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const tiles = CATEGORIES.map((c) => ({ name: c, total: counts[c] ?? 0 }));

  return (
    <section ref={sectionRef} className="bg-bg-soft">
      <div className="mx-auto max-w-page px-4 py-20 md:px-6 md:py-24 lg:flex lg:min-h-[100dvh] lg:flex-col lg:justify-center lg:py-0">
        <div className="lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-14">
          {/* Bagian 1: judul + panel gambar produk kategori aktif */}
          <div>
            <Reveal>
              <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium tracking-tight text-ink">
                Belanja per kategori.
              </h2>
            </Reveal>
            <div
              data-cat-preview
              className="relative mt-8 hidden overflow-hidden rounded-lg2 border border-lavender bg-white lg:block lg:aspect-[4/3]"
            >
              {tiles.map((t, i) => {
                const Icon =
                  CATEGORY_ICONS[t.name as keyof typeof CATEGORY_ICONS];
                return (
                  <div
                    key={t.name}
                    data-cat-img={t.name}
                    data-show={i === 0 ? "true" : "false"}
                    className="cat-preview-frame absolute inset-0 flex items-center justify-center p-10"
                  >
                    {images[t.name] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={images[t.name]}
                        alt={`Produk ${t.name}`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <Icon
                        aria-hidden
                        weight="thin"
                        className="h-28 w-28 text-blue-deep/30"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bagian 2: indeks nama kategori, hover inversion biru */}
          <div className="mt-10 divide-y divide-lavender border-y border-lavender lg:mt-0">
            {tiles.map((t) => {
              const Icon =
                CATEGORY_ICONS[t.name as keyof typeof CATEGORY_ICONS];
              return (
                <div data-cat-row key={t.name}>
                  <button
                    onClick={() => pick(t.name)}
                    className="cat-row group relative block w-full overflow-hidden px-2 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric md:px-4 md:py-6"
                  >
                    {/* Fill inversion dari bawah */}
                    <span
                      aria-hidden
                      className="cat-row-fill absolute inset-0 origin-bottom bg-blue-deep"
                    />
                    <span className="relative flex items-center gap-4 md:gap-7">
                      <Icon
                        aria-hidden
                        weight="thin"
                        className="cat-icon h-8 w-8 shrink-0 text-blue-deep transition-colors duration-300 group-hover:text-blue-sky md:h-11 md:w-11"
                      />
                      <span className="cat-name min-w-0 flex-1 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold uppercase leading-none tracking-tight text-ink transition-colors duration-300 group-hover:text-white">
                        {t.name}
                      </span>
                      <span className="cat-meta shrink-0 font-mono text-xs tabular-nums text-gray-muted transition-colors duration-300 group-hover:text-blue-sky md:text-sm">
                        <span data-cat-count={t.total}>{t.total}</span> produk
                      </span>
                      <span
                        aria-hidden
                        className="cat-arrow hidden shrink-0 -translate-x-2 text-2xl text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:block"
                      >
                        →
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Fitur unggulan: bento dua jalur asimetris ---------------- */

function FeatureBento() {
  const sectionRef = useRef<HTMLElement>(null);

  /* GSAP: headline reveal per baris (bahasa motion yang sama dengan hero),
     sel bento menyusul ber-stagger, lalu percakapan chat terjadi di depan
     mata: tanya muncul, indikator mengetik berdenyut, jawaban masuk. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>(
        "[data-feat-line]",
        section,
      );
      const cells = gsap.utils.toArray<HTMLElement>(
        "[data-feat-cell]",
        section,
      );
      const bubbles = gsap.utils.toArray<HTMLElement>(
        "[data-feat-bubble]",
        section,
      );
      const typers = gsap.utils.toArray<HTMLElement>(
        "[data-feat-typing]",
        section,
      );

      gsap.set(lines, { yPercent: 112, rotate: 1.4 });
      gsap.set(cells, { y: 44, opacity: 0 });
      bubbles.forEach((bubble) => {
        gsap.set(bubble, {
          y: 12,
          opacity: 0,
          scale: 0.94,
          transformOrigin:
            bubble.dataset.side === "user" ? "100% 100%" : "0% 100%",
        });
      });

      /* Bubble muncul dari sudut asalnya, seperti chat sungguhan */
      const pop = () => ({
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.6)",
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 72%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.to(lines, { yPercent: 0, rotate: 0, duration: 0.95, stagger: 0.1 })
            .to(cells, { y: 0, opacity: 1, duration: 0.85, stagger: 0.12 }, 0.2)
            .addLabel("chat", 0.85)
            .to(bubbles[0], pop(), "chat")
            .to(typers[0], { autoAlpha: 1, duration: 0.2 }, "chat+=0.4")
            .to(typers[0], { autoAlpha: 0, duration: 0.15 }, "chat+=1.25")
            .to(bubbles[1], pop(), "chat+=1.3")
            .to(bubbles[2], pop(), "chat+=1.85")
            .to(typers[1], { autoAlpha: 1, duration: 0.2 }, "chat+=2.3")
            .to(typers[1], { autoAlpha: 0, duration: 0.15 }, "chat+=3.05")
            .to(bubbles[3], pop(), "chat+=3.1");
        },
      });

      /* Kolom kanan yang di-offset melayang pelan mengikuti scroll:
         menegaskan komposisi dua jalur asimetris (desktop saja) */
      if (window.matchMedia("(min-width: 1024px)").matches) {
        gsap.to("[data-feat-right]", {
          y: -36,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-bg-soft">
      <div className="mx-auto max-w-page px-4 py-20 md:px-6 md:py-28">
        {/* Momen display: dua baris ter-mask, baris kedua adalah tagline brand */}
        <h2 className="font-display text-[clamp(2.3rem,5.2vw,4.25rem)] font-medium leading-[1.06] tracking-tight text-ink">
          <span className="-mb-[0.08em] block overflow-hidden pb-[0.08em]">
            <span data-feat-line className="block">
              Bukan sekadar katalog.
            </span>
          </span>
          <span className="-mb-[0.08em] block overflow-hidden pb-[0.08em]">
            <span data-feat-line className="block text-blue-deep">
              Katalog yang berpikir.
            </span>
          </span>
        </h2>

        {/* Bento dua jalur: panel chat lebar di kiri, kolom kanan sengaja
            di-offset ke bawah sebagai ritme editorial */}
        <div className="mt-12 grid gap-4 lg:grid-cols-12 lg:items-start">
          {/* Sel A: preview chat nyata, percakapan terjadi di depan mata */}
          <div
            data-feat-cell
            className="motion-surface flex flex-col rounded-lg2 border border-lavender bg-white p-6 md:p-7 lg:col-span-7"
          >
            <ChatCircleDots size={28} className="text-blue-deep" />
            <h3 className="mt-4 font-display text-xl font-semibold text-ink">
              Chat AI di setiap produk
            </h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gray2">
              Tanyakan apa saja di halaman produk, dijawab dari spesifikasinya.
            </p>
            {/* Contoh percakapan memakai gaya bubble chat asli; indikator
                mengetik menandakan AI sedang menyusun jawaban */}
            <div className="mt-6 flex-1 space-y-3 rounded-md2 bg-bg-soft/70 p-4 md:p-5">
              <p
                data-feat-bubble
                data-side="user"
                className="ml-auto w-fit max-w-[80%] rounded-md2 bg-blue-tint px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft"
              >
                Kuat buat editing video?
              </p>
              <div className="relative">
                <span
                  data-feat-typing
                  aria-hidden="true"
                  className="invisible absolute left-0 top-0 inline-flex items-center gap-1 rounded-md2 border border-lavender bg-white px-3.5 py-[13px] opacity-0"
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
                <p
                  data-feat-bubble
                  data-side="ai"
                  className="mr-auto w-fit max-w-[80%] rounded-md2 border border-lavender bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft"
                >
                  Dengan RAM 16GB dan prosesor i7, laptop ini sanggup untuk
                  editing video 1080p dengan lancar.
                </p>
              </div>
              <p
                data-feat-bubble
                data-side="user"
                className="ml-auto w-fit max-w-[80%] rounded-md2 bg-blue-tint px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft"
              >
                Beratnya berapa?
              </p>
              <div className="relative">
                <span
                  data-feat-typing
                  aria-hidden="true"
                  className="invisible absolute left-0 top-0 inline-flex items-center gap-1 rounded-md2 border border-lavender bg-white px-3.5 py-[13px] opacity-0"
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
                <p
                  data-feat-bubble
                  data-side="ai"
                  className="mr-auto w-fit max-w-[80%] rounded-md2 border border-lavender bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft"
                >
                  Sekitar 1,4 kg, cukup ringan untuk dibawa kuliah setiap hari.
                </p>
              </div>
            </div>
          </div>

          {/* Sel B + C: kolom kanan ter-offset, drift pelan saat scroll */}
          <div data-feat-right className="grid gap-4 lg:col-span-5 lg:mt-16">
            <div
              data-feat-cell
              className="motion-surface flex flex-col rounded-lg2 border border-blue-electric/30 bg-blue-tint p-6 md:p-7"
            >
              <MagnifyingGlass size={28} className="text-blue-deep" />
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                Cari dengan bahasa sehari-hari
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft/80">
                Tidak perlu tahu istilah teknis. Tulis kebutuhanmu seperti
                bercerita ke teman, AI yang menerjemahkan ke spesifikasi.
              </p>
              <p className="mt-auto pt-6 font-mono text-xs italic leading-[1.4] text-blue-deep">
                &quot;laptop buat kuliah arsitektur budget 15 juta&quot;
              </p>
            </div>
            <div
              data-feat-cell
              className="motion-surface flex flex-col rounded-lg2 bg-blue-deep p-6 md:p-7"
            >
              <ShieldCheck size={28} className="text-blue-sky" />
              <h3 className="mt-4 font-display text-xl font-semibold text-white">
                Jawaban dari data asli
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                AI hanya menjawab berdasarkan spesifikasi produk di katalog.
                Kalau tidak tahu, ia bilang tidak tahu.
              </p>
              <p className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-blue-sky">
                Tanpa halusinasi
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ accordion (native details/summary) ---------------- */

const FAQS = [
  {
    q: "Apakah jawaban AI bisa dipercaya?",
    a: "AI hanya menjawab dari spesifikasi produk yang ada di katalog, bukan dari internet. Jika informasi tidak tersedia, AI akan mengatakannya alih-alih mengarang.",
  },
  {
    q: "Apakah saya perlu akun untuk bertanya ke AI?",
    a: "Tidak. Pencarian AI dan chat produk terbuka untuk semua pengunjung. Akun hanya diperlukan untuk fitur admin.",
  },
  {
    q: "Kenapa jawaban AI kadang lambat?",
    a: "Pertanyaan diproses oleh model AI secara real-time. Saat pertama kali dipakai setelah lama tidak aktif, model butuh beberapa detik untuk pemanasan.",
  },
  {
    q: "Bagaimana produk ditambahkan ke katalog?",
    a: "Admin mengelola produk lewat dashboard: menambah, mengubah, dan menghapus produk lengkap dengan foto dan spesifikasi teknis.",
  },
] as const;

function Faq() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28">
        <Reveal>
          <h2 className="text-center font-display text-[clamp(1.8rem,4vw,3rem)] font-medium tracking-tight text-ink">
            Pertanyaan umum.
          </h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group rounded-md2 border border-lavender bg-white open:border-blue-deep">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden
                    className="text-xl leading-none text-gray-muted transition-transform duration-200 group-open:rotate-45 group-open:text-blue-deep"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-gray2">
                  {f.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
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
  const sectionRef = useRef<HTMLElement>(null);
  const firstData = useRef(true);
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

  // Terima pilihan kategori dari section CategoryTiles
  useEffect(() => {
    const onPick = (e: Event) => {
      const cat = (e as CustomEvent<string>).detail;
      setCategory(cat);
      setPage(1);
    };
    window.addEventListener("katalis:category", onPick);
    return () => window.removeEventListener("katalis:category", onPick);
  }, []);

  /* GSAP: entrance headline + filter bar lalu grid naik, sekali jalan.
     Bahasa yang sama dengan section lain (hierarki). */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const head = section.querySelector("[data-katalog-head]");
      const grid = section.querySelector("[data-katalog-grid]");
      gsap.set(head, { y: 32, opacity: 0 });
      gsap.set(grid, { y: 44, opacity: 0 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        once: true,
        onEnter: () => {
          gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .to(head, { y: 0, opacity: 1, duration: 0.8 })
            .to(grid, { y: 0, opacity: 1, duration: 0.9 }, 0.15);
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  /* GSAP: stagger kartu saat hasil filter/halaman berubah
     (feedback atas aksi pengguna). Lewati muatan pertama. */
  useEffect(() => {
    if (loading || !data) return;
    if (firstData.current) {
      firstData.current = false;
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = section.querySelectorAll("[data-katalog-card]");
    if (cards.length === 0) return;
    gsap.fromTo(
      cards,
      { y: 22, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
        stagger: 0.05,
        clearProps: "transform,opacity",
      },
    );
  }, [data, loading]);

  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total / 12)) : 1;

  return (
    <section id="katalog" ref={sectionRef} className="bg-white">
      <div className="mx-auto max-w-page px-4 py-20 md:px-6 md:py-28">
        <div data-katalog-head>
          <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium tracking-tight text-ink">
            Jelajahi katalog.
          </h2>

          {/* Filter tipografi raksasa: select tampil sebagai display type */}
          <div className="mt-8 flex flex-wrap items-end gap-x-12 gap-y-6 border-b border-lavender pb-8">
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
        </div>

        {error && (
          <p className="mt-8 rounded-md2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div
          data-katalog-grid
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : data?.data.map((p) => (
                <div data-katalog-card key={p._id}>
                  <ProductCard product={p} />
                </div>
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Cara kerja: numbered steps ---------------- */

const STEPS = [
  {
    no: "01",
    title: "Saring produk",
    body: "Mulai dari kategori dan rentang harga yang paling dekat dengan kebutuhanmu.",
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
          {STEPS.map((s, i) => {
            const utama = i === 1; // "Tanya AI" = fitur inti, kartu di-highlight
            return (
              <Reveal key={s.no} delay={i * 110}>
                <div
                  className={`motion-surface group relative h-full overflow-hidden rounded-lg2 border p-7 transition-colors ${
                    utama
                      ? "border-blue-deep bg-blue-deep"
                      : "border-lavender bg-white hover:border-blue-deep hover:bg-blue-tint/40"
                  }`}
                >
                  {utama && (
                    <svg
                      viewBox="0 0 64 64"
                      aria-hidden
                      className="absolute -right-4 -top-4 h-28 w-28 opacity-15"
                    >
                      <rect
                        x="14"
                        y="24"
                        width="4.5"
                        height="16"
                        rx="2.25"
                        fill="#FFFFFF"
                      />
                      <rect
                        x="22.5"
                        y="17"
                        width="4.5"
                        height="30"
                        rx="2.25"
                        fill="#FFFFFF"
                      />
                      <rect
                        x="31"
                        y="10"
                        width="4.5"
                        height="44"
                        rx="2.25"
                        fill="#7CB1FF"
                      />
                      <rect
                        x="39.5"
                        y="17"
                        width="4.5"
                        height="30"
                        rx="2.25"
                        fill="#FFFFFF"
                      />
                      <rect
                        x="48"
                        y="24"
                        width="4.5"
                        height="16"
                        rx="2.25"
                        fill="#FFFFFF"
                      />
                    </svg>
                  )}
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-md2 font-mono text-lg font-semibold tabular-nums transition-colors duration-200 ${
                      utama
                        ? "bg-white/15 text-white"
                        : "bg-blue-tint text-blue-deep group-hover:bg-blue-deep group-hover:text-white"
                    }`}
                  >
                    {s.no}
                  </span>
                  <h3
                    className={`mt-6 font-display text-xl font-semibold ${
                      utama ? "text-white" : "text-ink"
                    }`}
                  >
                    {s.title}
                  </h3>
                  <p
                    className={`mt-2.5 max-w-[36ch] text-sm leading-relaxed ${
                      utama ? "text-white/75" : "text-gray2"
                    }`}
                  >
                    {s.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Showcase dashboard: screenshot asli aplikasi ---------------- */

function DashboardShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  /* GSAP: headline masuk, screenshot pembeli naik dari kiri, screenshot
     admin menyusul dari kanan. Setelahnya scrub parallax ringan memisahkan
     kedua layar saat halaman digulir (hanya lg, ada ruang overlap). */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const head = section.querySelector("[data-show-head]");
      const shotA = section.querySelector("[data-show-a]");
      const shotB = section.querySelector("[data-show-b]");

      gsap.set(head, { y: 28, opacity: 0 });
      gsap.set(shotA, { y: 56, x: -24, opacity: 0 });
      gsap.set(shotB, { y: 72, x: 24, opacity: 0 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        once: true,
        onEnter: () => {
          gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .to(head, { y: 0, opacity: 1, duration: 0.75 })
            .to(shotA, { y: 0, x: 0, opacity: 1, duration: 1 }, 0.2)
            .to(shotB, { y: 0, x: 0, opacity: 1, duration: 1 }, 0.42);
        },
      });

      // Parallax ringan: layar admin bergeser lebih lambat dari layar pembeli.
      // Memakai yPercent agar tidak bentrok dengan y milik timeline entrance.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        gsap.to(shotB, {
          yPercent: -7,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="overflow-hidden bg-blue-deep">
      <div className="mx-auto max-w-page px-4 py-20 md:px-6 md:py-28">
        <div data-show-head className="max-w-2xl">
          <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium tracking-tight text-white">
            Seperti ini di dalamnya.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
            Tangkapan layar asli, bukan mockup. Pembeli mendapat beranda
            pencarian AI, admin mendapat ruang kelola katalog.
          </p>
        </div>

        {/* Dua layar bertumpuk offset di lg, bertumpuk vertikal di bawahnya */}
        <div className="relative mt-12 lg:mt-16 lg:pb-24 lg:pr-[26%]">
          <figure data-show-a className="relative z-0">
            <div className="overflow-hidden rounded-lg2 border border-white/15 bg-bg-soft shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)]">
              <Image
                src="/showcase/dashboard-buyer.png"
                alt="Dashboard pembeli KATALIS dengan pencarian AI, pintasan kategori, dan produk terbaru"
                width={1440}
                height={900}
                className="block h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-blue-sky">
              <span>01</span>
              <span className="text-white/80">
                Dashboard pembeli, tanya AI dan jelajahi katalog
              </span>
            </figcaption>
          </figure>

          <figure
            data-show-b
            className="relative z-10 mt-8 lg:absolute lg:-bottom-0 lg:-right-[8%] lg:mt-0 lg:w-[58%]"
          >
            <div className="overflow-hidden rounded-lg2 border border-white/15 bg-bg-soft shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)]">
              <Image
                src="/showcase/dashboard-admin.png"
                alt="Dashboard admin KATALIS dengan statistik katalog dan kelola produk"
                width={1440}
                height={900}
                className="block h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-blue-sky">
              <span>02</span>
              <span className="text-white/80">
                Dashboard admin, kelola produk dan pantau nilai katalog
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA bawah: rotating word ---------------- */

function BottomCta() {
  return (
    <section className="bg-bg-soft pb-20 md:pb-28">
      <div className="mx-auto max-w-page px-4 md:px-6">
        <Reveal variant="scale">
          <div className="overflow-hidden rounded-xl2 bg-blue-deep">
            <div className="px-6 pb-10 pt-14 text-center md:px-16 md:pt-20">
              <h2
                aria-label="Siap menemukan produk terbaikmu?"
                className="mx-auto max-w-4xl font-display text-[clamp(2rem,5.5vw,4.2rem)] font-medium uppercase leading-[1.02] tracking-[-0.02em] text-white"
              >
                <span aria-hidden className="block">
                  Siap menemukan
                </span>
                <span
                  aria-hidden
                  className="mt-[0.12em] flex flex-col items-center justify-center gap-[0.15em] sm:flex-row"
                >
                  <RotatingWord
                    words={[
                      "laptop",
                      "smartphone",
                      "tablet",
                      "monitor",
                      "aksesoris",
                    ]}
                  />
                  <span>terbaikmu?</span>
                </span>
              </h2>
              <a
                href="#katalog"
                className="arrow-btn motion-button mt-10 inline-block rounded-md2 bg-white px-8 py-4 text-[15px] font-semibold text-blue-deep"
              >
                Jelajahi katalog <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Ornamen isometrik wireframe (kiri: laptop + HP, kanan: monitor + HP + tablet) ---------------- */

function HeroOrnamentLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 440 360" fill="none" className={className} aria-hidden>
      <g stroke="#E0E0EB" strokeWidth="1.5">
        {/* Laptop isometrik terbuka: layar */}
        <path d="M60 150 L200 80 L340 150 L200 220 Z" />
        <path d="M78 150 L200 89 L322 150 L200 211 Z" opacity="0.6" />
        {/* Bodi/keyboard */}
        <path d="M60 150 L60 172 L200 242 L340 172 L340 150" />
        <path d="M200 220 L200 242" />
        {/* Garis keyboard */}
        <path d="M110 180 L200 226 L290 180" opacity="0.5" />
        <path d="M92 168 L200 222 L308 168" opacity="0.4" />
        {/* Smartphone tergeletak di depan */}
        <path d="M96 268 L146 243 L196 268 L146 293 Z" />
        <path d="M96 268 L96 278 L146 303 L196 278 L196 268" />
        <path d="M146 293 L146 303" />
        <path d="M126 264 L166 264" opacity="0.5" />
      </g>
    </svg>
  );
}

function HeroOrnamentRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 400" fill="none" className={className} aria-hidden>
      <g stroke="#E0E0EB" strokeWidth="1.5">
        {/* Monitor isometrik: layar tegak */}
        <path d="M70 120 L230 40 L230 150 L70 230 Z" />
        <path d="M82 122 L218 54 L218 144 L82 212 Z" opacity="0.6" />
        {/* Ketebalan panel */}
        <path d="M230 40 L244 47 L244 157 L230 150" />
        <path d="M244 157 L84 237 L70 230" opacity="0.7" />
        {/* Kaki + alas monitor */}
        <path d="M150 192 L150 238" />
        <path d="M110 252 L150 232 L190 252 L150 272 Z" />
        <path d="M110 252 L110 260 L150 280 L190 260 L190 252" opacity="0.7" />
        <path d="M150 272 L150 280" opacity="0.7" />
        {/* Smartphone berdiri di kanan */}
        <path d="M256 236 L298 215 L298 292 L256 313 Z" />
        <path d="M262 241 L292 226 L292 284 L262 299 Z" opacity="0.5" />
        <path d="M298 215 L306 219 L306 296 L298 292" />
        {/* Tablet tergeletak di depan */}
        <path d="M58 302 L112 275 L166 302 L112 329 Z" />
        <path d="M58 302 L58 312 L112 339 L166 312 L166 302" />
        <path d="M112 329 L112 339" />
        <path d="M84 300 L140 300" opacity="0.5" />
      </g>
    </svg>
  );
}
