import { buildProductChatPrompt, buildSearchPrompt } from "./prompt.builder";
import { extractPriceCap } from "./ai.service";

const product = {
  name: "Laptop Acer Swift 3",
  category: "Laptop",
  price: 10500000,
  specs: { processor: "Intel i7", ram: "16GB DDR5" },
};

describe("buildProductChatPrompt", () => {
  it("menyertakan guardrail, data produk, dan pertanyaan user", () => {
    const prompt = buildProductChatPrompt(product, "Kuat buat Docker?");
    expect(prompt).toContain("Bahasa Indonesia");
    expect(prompt).toContain("Laptop Acer Swift 3");
    expect(prompt).toContain("16GB DDR5");
    expect(prompt).toContain("Kuat buat Docker?");
  });

  it("menyertakan instruksi menolak pertanyaan di luar topik elektronik", () => {
    const prompt = buildProductChatPrompt(product, "apa saja?");
    expect(prompt).toContain("tidak ada hubungannya dengan elektronik");
    expect(prompt).toContain("pertanyaan UMUM seputar elektronik");
  });
});

describe("buildSearchPrompt", () => {
  it("menyertakan semua kandidat dan kebutuhan user", () => {
    const prompt = buildSearchPrompt(
      [product, { ...product, name: "ASUS TUF F15" }],
      "laptop buat rendering 3D",
    );
    expect(prompt).toContain("1. Laptop Acer Swift 3");
    expect(prompt).toContain("2. ASUS TUF F15");
    expect(prompt).toContain("laptop buat rendering 3D");
  });
});

describe("extractPriceCap", () => {
  it.each([
    ["Laptop under 10 juta buat rendering", 10000000],
    ["hp dibawah 5jt", 5000000],
    ["budget 7.5 juta", 7500000],
    ["laptop gaming murah", null],
  ])("%s -> %s", (query, expected) => {
    expect(extractPriceCap(query)).toBe(expected);
  });
});
