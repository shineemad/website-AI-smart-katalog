import { Product } from "../products/schemas/product.schema";

const GUARDRAIL = `Kamu adalah asisten belanja AI untuk toko SmartCatalog, toko elektronik (laptop, smartphone, tablet, monitor, dan aksesoris).
Aturan wajib:
- Untuk pertanyaan tentang produk spesifik: jawab berdasarkan data produk yang diberikan. Jangan pernah mengarang spesifikasi yang tidak ada di data. Jika data tidak mencantumkannya, katakan jujur, lalu boleh tambahkan penjelasan umum bila membantu (tandai sebagai informasi umum).
- Untuk pertanyaan UMUM seputar elektronik (arti istilah teknis seperti RAM/OLED/refresh rate, perbandingan teknologi, tips memilih perangkat, tips perawatan): jawab dengan pengetahuan umummu secara ringkas dan edukatif, meskipun jawabannya tidak ada di data produk.
- Tolak dengan sopan HANYA pertanyaan yang tidak ada hubungannya dengan elektronik atau belanja gadget (politik, pribadi, resep masakan, dll), lalu arahkan user kembali ke topik produk.
- Selalu jawab dalam Bahasa Indonesia yang sopan, ringkas, dan mudah dipahami.
- FORMAT JAWABAN: teks polos saja. DILARANG memakai heading markdown (#, ##, ###), tabel (baris dengan |), blok kode, atau pemisah (***). Gunakan paragraf pendek dan daftar sederhana bernomor (1.) atau strip (-). Penebalan **teks** boleh dipakai seperlunya.`;

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

Tugasmu:
- Jika user mencari/meminta produk: rekomendasikan produk terbaik dari daftar di atas, sebutkan nama produknya dan jelaskan alasannya secara singkat. Jika tidak ada yang cocok, katakan dengan jujur.
- Jika user bertanya hal umum seputar elektronik (istilah, perbandingan teknologi, tips memilih): jawab pertanyaannya dulu secara edukatif, lalu bila relevan tawarkan produk dari daftar yang sesuai.

REKOMENDASI:`;
}
