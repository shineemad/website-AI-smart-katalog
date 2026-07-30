"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChatCircleDots,
  MagnifyingGlass,
  SignOut,
  SquaresFour,
  Storefront,
} from "@phosphor-icons/react";
import { LogoMark } from "@/components/logo";
import { AiText } from "@/components/ai-text";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { api, ApiError, Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = ["Laptop", "Smartphone", "Tablet", "Monitor", "Aksesoris"];

export default function UserDashboardPage() {
  const { token, role, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!token) router.replace("/login");
    else if (role === "admin") router.replace("/admin");
  }, [ready, token, role, router]);

  if (!ready || !token || role === "admin") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-soft">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-muted">
          Memeriksa akses
        </p>
      </div>
    );
  }

  return <BuyerDashboard />;
}

/* ---------------- Dashboard buyer: top bar + hub belanja ---------------- */

function BuyerDashboard() {
  const { email, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-bg-soft">
      {/* Top bar: identitas buyer, beda dari sidebar ikon admin */}
      <header className="border-b border-lavender bg-white">
        <div className="mx-auto flex h-[64px] max-w-page items-center justify-between gap-4 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="font-display text-base font-semibold uppercase tracking-tight text-ink">
              Katalis
            </span>
            <span className="rounded-sm2 bg-blue-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-blue-deep">
              Akun Saya
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/#katalog"
              className="hidden items-center gap-1.5 text-sm font-medium text-gray2 transition-colors hover:text-ink sm:flex"
            >
              <Storefront size={17} /> Katalog
            </Link>
            <span className="hidden font-mono text-xs text-gray-muted lg:block">
              {email}
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex items-center gap-1.5 rounded-md2 border border-lavender px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:border-danger hover:text-danger active:scale-[0.98]"
            >
              <SignOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-page px-4 py-8 md:px-6 md:py-10">
        <Greeting email={email} />
        <AiQuickSearch />
        <CategoryShortcuts />
        <LatestProducts />
      </main>
    </div>
  );
}

function Greeting({ email }: { email: string | null }) {
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const name = email ? email.split("@")[0] : "Pengguna";

  return (
    <div>
      <p className="font-mono text-[11px] capitalize tracking-wide text-gray-muted">
        {today}
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
        Halo, <span className="capitalize">{name}</span>.
      </h1>
      <p className="mt-2 max-w-md text-[15px] text-gray2">
        Mau cari apa hari ini? Tanya AI atau jelajahi katalog.
      </p>
    </div>
  );
}

/* ---------------- Tanya AI langsung dari dashboard ---------------- */

function AiQuickSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reply: string;
    products: Product[];
  } | null>(null);

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
    <section className="mt-8 rounded-lg2 border border-lavender bg-white p-5 md:p-6">
      <div className="flex items-center gap-2.5">
        <ChatCircleDots size={22} className="text-blue-deep" />
        <h2 className="font-display text-lg font-semibold text-ink">
          Tanya AI
        </h2>
      </div>
      <form onSubmit={ask} className="mt-4 flex items-center gap-2">
        <label htmlFor="dash-ai" className="sr-only">
          Pertanyaan untuk AI
        </label>
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlass
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-faint"
          />
          <input
            id="dash-ai"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: laptop untuk kuliah budget 10 juta"
            maxLength={500}
            className="h-12 w-full rounded-md2 border border-lavender bg-bg-soft/50 pl-11 pr-4 text-[15px] text-ink placeholder:text-gray-faint focus:border-blue-deep focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="arrow-btn h-12 shrink-0 rounded-md2 bg-blue-deep px-5 text-[15px] font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Berpikir..." : "Tanya"}{" "}
          {!loading && <span className="arrow">→</span>}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5 rounded-md2 bg-bg-soft/70 p-4 md:p-5">
          <AiText
            text={result.reply}
            className="text-[15px] leading-relaxed text-ink-soft"
          />
          {result.products.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {result.products.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------- Pintasan kategori ke katalog ---------------- */

function CategoryShortcuts() {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2.5">
        <SquaresFour size={22} className="text-blue-deep" />
        <h2 className="font-display text-lg font-semibold text-ink">
          Kategori
        </h2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href="/#katalog"
            className="rounded-full border border-lavender bg-white px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-blue-deep hover:text-blue-deep active:scale-[0.98]"
          >
            {c}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Produk terbaru dari katalog ---------------- */

function LatestProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .listProducts({ limit: 8 })
      .then((res) => setProducts(res.data))
      .catch(() => setError(true));
  }, []);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Produk terbaru
        </h2>
        <Link
          href="/#katalog"
          className="arrow-btn text-sm font-semibold text-blue-deep hover:underline"
        >
          Lihat semua <span className="arrow">→</span>
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Gagal memuat produk. Pastikan server API berjalan.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products === null && !error
          ? Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products?.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
