import { Product } from "../products/schemas/product.schema";

const GUARDRAIL = `Kamu adalah asisten belanja AI untuk toko SmartCatalog.
Aturan wajib:
- Jawab HANYA berdasarkan data produk yang diberikan di bawah. Jangan mengarang spesifikasi.
- Jawab dalam Bahasa Indonesia yang sopan, ringkas, dan mudah dipahami.
- Jika pertanyaan di luar konteks produk (politik, pribadi, dll), tolak dengan sopan dan arahkan user untuk bertanya seputar produk.
- Jika data tidak cukup untuk menjawab, katakan dengan jujur bahwa informasi tersebut tidak tersedia pada spesifikasi produk.`;

/** Prompt Modul 2: chat kontekstual pada satu produk. */
export function buildProductChatPrompt(
  product: Pick<Product, "name" | "category" | "price" | "specs">,
  question: string,
): string {
  return `${GUARDRAIL}

DATA PRODUK:
${JSON.stringify(
  {
    name: product.name,
    category: product.category,
    price: product.price,
    specs: product.specs,
  },
  null,
  2,
)}

PERTANYAAN USER:
${question}

JAWABAN:`;
}

/** Prompt Modul 3: rekomendasi dari beberapa kandidat produk. */
export function buildSearchPrompt(
  candidates: Pick<Product, "name" | "category" | "price" | "specs">[],
  query: string,
): string {
  const list = candidates
    .map(
      (p, i) =>
        `${i + 1}. ${p.name} | kategori: ${p.category} | harga: Rp${p.price.toLocaleString("id-ID")} | specs: ${JSON.stringify(p.specs)}`,
    )
    .join("\n");
  return `${GUARDRAIL}

DAFTAR KANDIDAT PRODUK:
${list}

KEBUTUHAN USER:
${query}

Tugasmu: rekomendasikan produk terbaik dari daftar di atas untuk kebutuhan user, sebutkan nama produknya dan jelaskan alasannya secara singkat. Jika tidak ada yang cocok, katakan dengan jujur.

REKOMENDASI:`;
}
