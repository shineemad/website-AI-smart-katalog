/**
 * Import produk asli dari katalog toko (DummyJSON store API).
 * Foto produk asli (CDN toko) -> MinIO, data produk -> MongoDB.
 * Nama produk dijamin sesuai dengan fotonya.
 * Jalankan: node scripts/import-store-products.js
 */
const Minio = require("minio");
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smartcatalog";
const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
const BUCKET = process.env.MINIO_BUCKET || "products";
const USD_TO_IDR = 16000;

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const productSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    price: Number,
    imageUrl: { type: String, default: "" },
    specs: { type: Object, default: {} },
    tenantId: { type: String, default: "default" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
const Product = mongoose.model("Product", productSchema);

// kategori toko -> kategori katalog frontend
const CATEGORY_MAP = {
  laptops: "Laptop",
  smartphones: "Smartphone",
  tablets: "Tablet",
  "mobile-accessories": "Aksesoris",
};

// prefix nama agar konsisten dengan penamaan katalog (kecuali sudah mengandung kata itu)
const NAME_PREFIX = {
  Laptop: "Laptop",
  Smartphone: "Smartphone",
  Tablet: "Tablet",
  Aksesoris: "",
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const nicePrice = (usd) =>
  Math.max(99000, Math.round((usd * USD_TO_IDR) / 10000) * 10000 - 1000);

function buildName(title, category) {
  const prefix = NAME_PREFIX[category];
  if (!prefix || title.toLowerCase().startsWith(prefix.toLowerCase())) {
    return title;
  }
  return `${prefix} ${title}`;
}

function buildSpecs(p) {
  const specs = {};
  if (p.brand) specs.brand = p.brand;
  if (p.description) specs.deskripsi = p.description;
  if (p.weight) specs.berat = `${p.weight} gram (berat pengiriman)`;
  if (p.dimensions) {
    specs.dimensi = `${p.dimensions.width} x ${p.dimensions.height} x ${p.dimensions.depth} cm`;
  }
  if (p.warrantyInformation) specs.garansi = p.warrantyInformation;
  if (p.shippingInformation) specs.pengiriman = p.shippingInformation;
  if (p.rating) specs.rating = `${p.rating} / 5`;
  if (p.sku) specs.sku = p.sku;
  return specs;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function downloadImage(url) {
  const res = await fetch(url, { redirect: "follow" });
  const type = (res.headers.get("content-type") || "").split(";")[0];
  if (!res.ok || !type.startsWith("image/")) {
    throw new Error(`unduh gagal (${res.status} ${type}): ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1000) throw new Error(`file terlalu kecil: ${url}`);
  return { buffer, contentType: type };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB terhubung");

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [storeCat, catalogCat] of Object.entries(CATEGORY_MAP)) {
    const data = await fetchJson(
      `https://dummyjson.com/products/category/${storeCat}?limit=100`,
    );
    console.log(`\n[${catalogCat}] ${data.products.length} produk dari toko`);

    for (const p of data.products) {
      const name = buildName(p.title, catalogCat);
      const exists = await Product.findOne({ name }).lean();
      if (exists) {
        console.log(`- Lewati (sudah ada): ${name}`);
        skipped++;
        continue;
      }

      try {
        const imgSrc = p.images?.[0] || p.thumbnail;
        const img = await downloadImage(imgSrc);
        const ext = img.contentType === "image/webp" ? ".webp"
          : img.contentType === "image/png" ? ".png" : ".jpg";
        const objectName = `store/${slug(name)}${ext}`;
        await minio.putObject(
          BUCKET,
          objectName,
          img.buffer,
          img.buffer.length,
          { "Content-Type": img.contentType },
        );
        const imageUrl = `${MINIO_PUBLIC_URL}/${BUCKET}/${objectName}`;

        await Product.create({
          name,
          category: catalogCat,
          price: nicePrice(p.price),
          imageUrl,
          specs: buildSpecs(p),
          tenantId: "default",
        });
        console.log(`+ ${name} (${Math.round(img.buffer.length / 1024)}KB)`);
        created++;
      } catch (err) {
        console.warn(`! Gagal ${name}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\nSelesai: ${created} dibuat, ${skipped} dilewati, ${failed} gagal`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
