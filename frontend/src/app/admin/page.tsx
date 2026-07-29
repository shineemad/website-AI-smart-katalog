"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  House,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  SignOut,
  Trash,
} from "@phosphor-icons/react";
import { LogoMark } from "@/components/logo";
import { api, ApiError, formatRupiah, Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = ["Laptop", "Smartphone", "Tablet", "Monitor", "Aksesoris"];

export default function AdminPage() {
  const { role, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && role !== "admin") router.replace("/");
  }, [ready, role, router]);

  if (!ready || role !== "admin") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-soft">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-muted">
          Memeriksa akses
        </p>
      </div>
    );
  }

  return <Dashboard />;
}

/* ---------------- App shell: sidebar ikon + area konten ---------------- */

function Dashboard() {
  const { email, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listProducts({
        category: category || undefined,
        limit: 50,
      });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function remove(p: Product) {
    if (!confirm(`Hapus "${p.name}"? Tindakan ini tidak bisa dibatalkan.`))
      return;
    try {
      await api.deleteProduct(p._id);
      notify("Produk dihapus.");
      load();
    } catch {
      notify("Gagal menghapus produk.");
    }
  }

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex min-h-[100dvh] bg-lavender/50">
      {/* Sidebar ikon */}
      <aside className="sticky top-0 flex h-[100dvh] w-[76px] shrink-0 flex-col items-center justify-between border-r border-lavender bg-white py-5">
        <div className="flex flex-col items-center gap-7">
          <Link href="/" aria-label="Beranda KATALIS">
            <LogoMark size={38} />
          </Link>
          <nav className="flex flex-col items-center gap-2">
            <Link
              href="/"
              title="Beranda"
              className="flex h-11 w-11 items-center justify-center rounded-md2 text-gray-muted transition-colors hover:bg-bg-soft hover:text-ink"
            >
              <House size={21} weight="regular" />
            </Link>
            <span
              title="Produk"
              className="flex h-11 w-11 items-center justify-center rounded-md2 border border-blue-electric/30 bg-blue-tint text-blue-deep"
            >
              <Package size={21} weight="fill" />
            </span>
          </nav>
        </div>
        <div className="flex flex-col items-center gap-4">
          <span
            title={email ?? "Admin"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold uppercase text-white"
          >
            {(email ?? "A").charAt(0)}
          </span>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            title="Keluar"
            className="flex h-11 w-11 items-center justify-center rounded-md2 text-gray-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <SignOut size={21} />
          </button>
        </div>
      </aside>

      {/* Area konten */}
      <main className="min-w-0 flex-1 px-5 py-6 md:px-10">
        {/* Header: sambutan + pencarian */}
        <header className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-lavender pb-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] capitalize tracking-wide text-gray-muted">
              {today}
            </p>
            <p className="mt-0.5 truncate font-display text-[15px] font-semibold text-ink">
              Selamat datang, {email}
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md flex-1">
            <MagnifyingGlass
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-faint"
            />
            <label htmlFor="dash-search" className="sr-only">
              Cari produk
            </label>
            <input
              id="dash-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk"
              className="h-11 w-full rounded-md2 border border-transparent bg-white pl-11 pr-4 text-sm text-ink placeholder:text-gray-faint focus:border-blue-deep focus:outline-none"
            />
          </div>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 rounded-md2 bg-blue-deep px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> Tambah Produk
          </button>
        </header>

        {/* Selector besar ala storefront + ringkasan katalog */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <div>
            <label
              htmlFor="dash-category"
              className="block font-mono text-[11px] uppercase tracking-[0.15em] text-gray-muted"
            >
              Kategori
            </label>
            <div className="relative mt-0.5 inline-block">
              <select
                id="dash-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent pr-8 font-display text-3xl font-semibold tracking-tight text-ink focus:outline-none md:text-4xl"
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
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xl text-gray-muted"
              >
                ⌄
              </span>
            </div>
          </div>
          <dl className="flex divide-x divide-lavender rounded-lg2 border border-lavender bg-white">
            <div className="px-6 py-3.5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-muted">
                Produk tampil
              </dt>
              <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-blue-deep">
                {loading ? "--" : visible.length}
              </dd>
            </div>
            <div className="px-6 py-3.5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-muted">
                Kategori
              </dt>
              <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-ink">
                {loading ? "--" : new Set(products.map((p) => p.category)).size}
              </dd>
            </div>
            <div className="hidden px-6 py-3.5 sm:block">
              <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-muted">
                Nilai katalog
              </dt>
              <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-ink">
                {loading
                  ? "--"
                  : formatRupiah(visible.reduce((s, p) => s + p.price, 0))}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-muted">
          Kelola produk
        </p>

        {/* Grid kartu produk */}
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {loading &&
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg2 border border-lavender bg-white p-4"
              >
                <div className="aspect-[4/3] animate-pulse rounded-md2 bg-bg-soft" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-bg-soft" />
                <div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-bg-soft" />
                <div className="mt-3 h-10 animate-pulse rounded-md2 bg-bg-soft" />
              </div>
            ))}

          {!loading &&
            visible.map((p) => (
              <div
                key={p._id}
                className="card-lift flex flex-col rounded-lg2 border border-lavender bg-white p-4"
              >
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md2 bg-bg-soft/60">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="font-mono text-xs uppercase tracking-widest text-gray-faint">
                      Tanpa gambar
                    </span>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-ink">
                  {p.name}
                </h3>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded-sm2 bg-blue-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-blue-deep">
                    {p.category}
                  </span>
                  <span className="font-mono text-[11px] text-gray-faint">
                    KTL-{p._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-ink">
                  {formatRupiah(p.price)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditing(p)}
                    className="flex items-center justify-center gap-1.5 rounded-md2 bg-blue-tint py-2.5 text-sm font-semibold text-blue-deep transition-colors hover:bg-blue-deep hover:text-white active:scale-[0.98]"
                  >
                    <PencilSimple size={15} /> Edit
                  </button>
                  <button
                    onClick={() => remove(p)}
                    className="flex items-center justify-center gap-1.5 rounded-md2 bg-danger/10 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white active:scale-[0.98]"
                  >
                    <Trash size={15} /> Hapus
                  </button>
                </div>
              </div>
            ))}
        </div>

        {!loading && visible.length === 0 && (
          <div className="mt-6 rounded-lg2 border border-lavender bg-white p-14 text-center">
            <p className="font-display text-xl font-medium text-ink">
              {search
                ? "Tidak ada produk yang cocok dengan pencarian."
                : "Belum ada produk."}
            </p>
            <p className="mt-2 text-sm text-gray2">
              {search
                ? "Coba kata kunci lain atau hapus filter."
                : "Klik Tambah Produk untuk mengisi katalog."}
            </p>
          </div>
        )}
      </main>

      {editing && (
        <ProductFormModal
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            notify("Produk disimpan.");
            load();
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md2 bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------------- Form create/edit ---------------- */

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [specsText, setSpecsText] = useState(
    JSON.stringify(product?.specs ?? { processor: "", ram: "" }, null, 2),
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    product?.imageUrl || null,
  );
  const [specsError, setSpecsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onFileChange(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  function validateSpecs(text: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || Array.isArray(parsed) || !parsed) {
        setSpecsError('Specs harus berupa objek JSON, contoh: {"ram": "16GB"}');
        return null;
      }
      setSpecsError(null);
      return parsed;
    } catch {
      setSpecsError("JSON tidak valid. Periksa tanda kutip dan koma.");
      return null;
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const specs = validateSpecs(specsText);
    if (!specs) return;
    setSaving(true);
    setError(null);
    const form = new FormData();
    form.set("name", name);
    form.set("category", category);
    form.set("price", price);
    form.set("specs", JSON.stringify(specs));
    if (file) form.set("image", file);
    try {
      if (product) await api.updateProduct(product._id, form);
      else await api.createProduct(form);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Gagal menyimpan: ${err.message}`
          : "Gagal menyimpan produk.",
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-lg2 bg-white p-6 md:p-8"
      >
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {product ? "Edit produk" : "Tambah produk"}
        </h2>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="p-name"
              className="block text-sm font-medium text-ink"
            >
              Nama produk
            </label>
            <input
              id="p-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop Acer Swift 3"
              className="h-11 w-full rounded-sm2 border border-lavender px-3.5 text-sm focus:border-blue-deep focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="p-category"
                className="block text-sm font-medium text-ink"
              >
                Kategori
              </label>
              <select
                id="p-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-sm2 border border-lavender bg-white px-3 text-sm focus:border-blue-deep focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="p-price"
                className="block text-sm font-medium text-ink"
              >
                Harga (Rp)
              </label>
              <input
                id="p-price"
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="10500000"
                className="h-11 w-full rounded-sm2 border border-lavender px-3.5 text-sm tabular-nums focus:border-blue-deep focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="p-specs"
              className="block text-sm font-medium text-ink"
            >
              Spesifikasi (JSON)
            </label>
            <textarea
              id="p-specs"
              rows={6}
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
              onBlur={() => validateSpecs(specsText)}
              spellCheck={false}
              className={`w-full rounded-sm2 border px-3.5 py-3 font-mono text-xs leading-relaxed focus:outline-none ${
                specsError
                  ? "border-danger focus:border-danger"
                  : "border-lavender focus:border-blue-deep"
              }`}
            />
            {specsError && <p className="text-xs text-danger">{specsError}</p>}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="p-image"
              className="block text-sm font-medium text-ink"
            >
              Foto produk (png/jpeg, max 5MB)
            </label>
            <input
              id="p-image"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray2 file:mr-4 file:rounded-sm2 file:border-0 file:bg-blue-tint file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-blue-deep hover:file:bg-lavender"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview gambar produk"
                className="mt-2 h-36 w-full rounded-sm2 border border-lavender object-cover"
              />
            )}
          </div>

          {error && (
            <p className="rounded-sm2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="h-11 flex-1 rounded-md2 bg-blue-deep text-sm font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.99] disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-md2 border border-lavender px-5 text-sm font-semibold text-gray2 transition-colors hover:border-ink hover:text-ink"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
