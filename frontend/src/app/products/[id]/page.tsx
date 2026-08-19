"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChatWidget } from "@/components/chat-widget";
import { api, formatRupiah, mediaUrl, Product } from "@/lib/api";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">(
    "loading",
  );

  useEffect(() => {
    if (!id) return;
    api
      .getProduct(id)
      .then((p) => {
        setProduct(p);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [id]);

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-white">
        <div className="mx-auto max-w-page px-4 py-10 md:px-6 md:py-14">
          {status === "loading" && <DetailSkeleton />}

          {status === "notfound" && (
            <div className="rounded-lg2 border border-lavender bg-bg-soft p-14 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-gray-muted">
                404
              </p>
              <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
                Produk tidak ditemukan.
              </h1>
              <Link
                href="/"
                className="arrow-btn mt-6 inline-block rounded-md2 bg-blue-deep px-6 py-3 text-sm font-semibold text-white"
              >
                Kembali ke katalog <span className="arrow">→</span>
              </Link>
            </div>
          )}

          {status === "ok" && product && (
            <>
              <nav className="font-mono text-xs uppercase tracking-[0.15em] text-gray-muted">
                <Link href="/" className="hover:text-blue-deep">
                  Katalog
                </Link>
                <span className="mx-2">/</span>
                <span>{product.category}</span>
                <span className="mx-2">/</span>
                <span className="text-ink">{product.name}</span>
              </nav>

              <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
                <div className="overflow-hidden rounded-lg2 border border-lavender bg-bg-soft">
                  {product.imageUrl ? (
                    <img
                      src={mediaUrl(product.imageUrl)}
                      alt={product.name}
                      className="aspect-[4/3] h-auto w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center font-mono text-sm uppercase tracking-widest text-gray-faint">
                      Tanpa gambar
                    </div>
                  )}
                </div>

                <div>
                  <span className="inline-block rounded-full bg-blue-tint px-3 py-1 font-mono text-xs uppercase tracking-wider text-blue-deep">
                    {product.category}
                  </span>
                  <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">
                    {product.name}
                  </h1>
                  <p className="mt-4 font-mono text-3xl font-semibold tabular-nums text-blue-deep">
                    {formatRupiah(product.price)}
                  </p>

                  <div className="mt-8">
                    <h2 className="font-display text-lg font-semibold text-ink">
                      Spesifikasi
                    </h2>
                    <dl className="mt-4 overflow-hidden rounded-md2 border border-lavender">
                      {Object.entries(product.specs || {}).map(
                        ([key, value], i) => (
                          <div
                            key={key}
                            className={`grid grid-cols-[140px_1fr] gap-4 px-4 py-3 text-sm ${
                              i % 2 === 0 ? "bg-bg-soft" : "bg-white"
                            }`}
                          >
                            <dt className="font-mono text-xs uppercase tracking-wider text-gray-muted">
                              {key}
                            </dt>
                            <dd className="text-ink-soft">{String(value)}</dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </div>

                  <p className="mt-8 rounded-md2 border border-blue-electric/30 bg-blue-tint px-4 py-3 text-sm text-ink-soft">
                    Ragu dengan produk ini? Tanyakan langsung ke AI lewat tombol
                    chat di kanan bawah.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      {status === "ok" && product && (
        <ChatWidget productId={product._id} productName={product.name} />
      )}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="aspect-[4/3] animate-pulse rounded-lg2 bg-bg-soft" />
      <div className="space-y-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-bg-soft" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-bg-soft" />
        <div className="h-8 w-1/2 animate-pulse rounded bg-bg-soft" />
        <div className="mt-6 h-48 animate-pulse rounded-md2 bg-bg-soft" />
      </div>
    </div>
  );
}
