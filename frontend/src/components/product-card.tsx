import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { Product, formatRupiah, mediaUrl } from "@/lib/api";

/**
 * Kartu produk pola storefront: gambar di area terang, nama 2 baris,
 * chip kode mono, harga bold, tombol full-width tint biru.
 * Hover: lift -4px + border biru (via .card-lift).
 */
export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product._id}`;
  const code = `KTL-${product._id.slice(-6).toUpperCase()}`;
  return (
    <div className="card-lift flex flex-col rounded-lg2 border border-lavender bg-white p-4">
      <Link href={href} className="group flex flex-1 flex-col">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md2 bg-bg-soft/60">
          {product.imageUrl ? (
            <img
              src={mediaUrl(product.imageUrl)}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <span className="font-mono text-xs uppercase tracking-widest text-gray-faint">
              Tanpa gambar
            </span>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-ink">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded-sm2 bg-blue-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-blue-deep">
            {product.category}
          </span>
          <span className="font-mono text-[11px] text-gray-faint">{code}</span>
        </div>
        <p className="mt-2.5 font-mono text-lg font-semibold tabular-nums text-ink">
          {formatRupiah(product.price)}
        </p>
      </Link>
      <Link
        href={href}
        className="mt-3 block rounded-md2 bg-blue-tint py-2.5 text-center text-sm font-semibold text-blue-deep transition-colors hover:bg-blue-deep hover:text-white active:scale-[0.99]"
      >
        + Lihat Detail
      </Link>
    </div>
  );
}

/** Skeleton kartu produk (loading state, bentuk sama dengan kartu asli). */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg2 border border-lavender bg-white p-4">
      <div className="aspect-square animate-pulse rounded-md2 bg-bg-soft" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-bg-soft" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-bg-soft" />
      <div className="mt-2.5 h-5 w-2/5 animate-pulse rounded bg-bg-soft" />
      <div className="mt-3 h-10 animate-pulse rounded-md2 bg-bg-soft" />
    </div>
  );
}
