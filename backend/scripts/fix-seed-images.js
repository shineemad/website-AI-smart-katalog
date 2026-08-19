/**
 * Ganti 50 placeholder SVG produk seed dengan foto produk asli.
 * Sumber utama: DummyJSON (https://dummyjson.com/docs/products) untuk produk
 * yang ada padanannya; kategori yang tidak tersedia di DummyJSON
 * (monitor, mouse, keyboard, SSD, hub) memakai foto produk sejenis dari Unsplash.
 * Jalankan: node scripts/fix-seed-images.js
 */
const Minio = require("minio");
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smartcatalog";
const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
const BUCKET = process.env.MINIO_BUCKET || "products";

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const unsplash = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

// dj = judul produk DummyJSON (gambar diambil dari images[0]-nya)
// us = ID foto Unsplash (untuk jenis produk yang tidak ada di DummyJSON)
const MAPPING = {
  // Laptop -> padankan brand/line sedekat mungkin
  "Laptop Acer Swift 3 SF314": { dj: "Huawei Matebook X Pro" },
  "Laptop ASUS TUF Gaming F15 FX507": {
    dj: "Asus Zenbook Pro Dual Screen Laptop",
  },
  "Laptop Lenovo IdeaPad Slim 3 15ABR8": { dj: "Lenovo Yoga 920" },
  "Laptop Apple MacBook Air 13 M4": {
    dj: "Apple MacBook Pro 14 Inch Space Grey",
  },
  "Laptop Apple MacBook Pro 14 M4 Pro": {
    dj: "Apple MacBook Pro 14 Inch Space Grey",
  },
  "Laptop HP Pavilion Aero 13": { dj: "Huawei Matebook X Pro" },
  "Laptop Dell Inspiron 14 5440": { dj: "New DELL XPS 13 9300 Laptop" },
  "Laptop Lenovo Legion 5 15ARP9 Gaming": { dj: "Lenovo Yoga 920" },
  "Laptop Axioo MyBook Hype 5": { dj: "Huawei Matebook X Pro" },
  "Laptop ASUS Zenbook 14 OLED UX3405": {
    dj: "Asus Zenbook Pro Dual Screen Laptop",
  },

  // Smartphone
  "Samsung Galaxy A55 5G": { dj: "Samsung Galaxy S8" },
  "Xiaomi Redmi Note 13 Pro": { dj: "Realme XT" },
  "Apple iPhone 16": { dj: "iPhone 13 Pro" },
  "Apple iPhone 16 Pro Max": { dj: "iPhone 13 Pro" },
  "Samsung Galaxy S24 Ultra": { dj: "Samsung Galaxy S10" },
  "OPPO Reno12 F 5G": { dj: "Oppo F19 Pro Plus" },
  "Infinix Note 40 Pro": { dj: "Realme C35" },
  "vivo V40 5G": { dj: "Vivo S1" },
  "Samsung Galaxy A16 5G": { dj: "Samsung Galaxy S7" },
  "Google Pixel 9": { dj: "Vivo X21" },

  // Tablet
  "Apple iPad 10th Gen WiFi 64GB": { dj: "iPad Mini 2021 Starlight" },
  "Apple iPad Air 11 M2 WiFi 128GB": { dj: "iPad Mini 2021 Starlight" },
  "Apple iPad Pro 13 M4 WiFi 256GB": { dj: "iPad Mini 2021 Starlight" },
  "Samsung Galaxy Tab S9 FE WiFi": { dj: "Samsung Galaxy Tab S8 Plus Grey" },
  "Samsung Galaxy Tab S10+ 5G": { dj: "Samsung Galaxy Tab S8 Plus Grey" },
  "Xiaomi Pad 6": { dj: "Samsung Galaxy Tab White" },
  "Xiaomi Redmi Pad SE": { dj: "Samsung Galaxy Tab White" },
  "Lenovo Tab P12": { dj: "Samsung Galaxy Tab White" },
  "HUAWEI MatePad 11.5 S": { dj: "Samsung Galaxy Tab White" },
  "Samsung Galaxy Tab A9+ WiFi": { dj: "Samsung Galaxy Tab S8 Plus Grey" },

  // Aksesoris (yang ada padanan DummyJSON)
  "Apple AirPods Pro 2 USB-C": { dj: "Apple Airpods" },
  "Samsung Galaxy Buds3 Pro": { dj: "Beats Flex Wireless Earphones" },
  "Anker PowerCore 20000mAh 30W Power Bank": {
    dj: "Apple MagSafe Battery Pack",
  },
  "Baseus GaN5 Pro 65W Charger": { dj: "Apple iPhone Charger" },
  "Apple Watch Series 10 46mm GPS": { dj: "Apple Watch Series 4 Gold" },
  "Sony WH-1000XM5 Headphone Wireless": { dj: "Apple AirPods Max Silver" },

  // Tidak tersedia di DummyJSON -> foto produk sejenis (Unsplash)
  "Logitech MX Master 3S Mouse Wireless": {
    us: "photo-1527864550417-7fd91fc51a46",
  },
  "Keychron K2 V2 Keyboard Mechanical Wireless": {
    us: "photo-1587829741301-dc798b83add3",
  },
  "SanDisk Extreme Portable SSD 1TB": {
    us: "photo-1628557044797-f21a177c37ec",
  },
  "Ugreen Revodok Pro USB-C Hub 9-in-1": {
    us: "photo-1618410320928-25228d811631",
  },

  // Monitor (DummyJSON tidak punya kategori monitor)
  "Monitor LG 24MR400 24 inci": { us: "photo-1527443224154-c4a3942d3acf" },
  "Monitor Samsung Odyssey G4 25 inci": { us: "photo-1551645120-d70bfe84c826" },
  "Monitor ASUS ProArt PA248QV 24 inci": {
    us: "photo-1547082299-de196ea013d6",
  },
  "Monitor Xiaomi A24i 24 inci": { us: "photo-1585792180666-f7347c490ee2" },
  "Monitor Dell UltraSharp U2723QE 27 inci 4K": {
    us: "photo-1616763355603-9755a640a287",
  },
  "Monitor LG UltraGear 27GS75Q 27 inci QHD": {
    us: "photo-1593640408182-31c70c8268f5",
  },
  "Monitor Samsung ViewFinity S6 32 inci": {
    us: "photo-1587831990711-23ca6441447b",
  },
  "Monitor AOC 24G4 24 inci Gaming": { us: "photo-1551645120-d70bfe84c826" },
  "Monitor MSI MAG 274UPF 27 inci 4K Gaming": {
    us: "photo-1593640408182-31c70c8268f5",
  },
  "Monitor Portable ARZOPA A1 15.6 inci": {
    us: "photo-1585792180666-f7347c490ee2",
  },
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function fetchDummyJsonImages() {
  const map = {};
  for (const cat of [
    "laptops",
    "smartphones",
    "tablets",
    "mobile-accessories",
  ]) {
    const res = await fetch(`https://dummyjson.com/products/category/${cat}`);
    const data = await res.json();
    for (const p of data.products) {
      map[p.title] = p.images?.[0] || p.thumbnail;
    }
  }
  return map;
}

async function downloadImage(url) {
  const res = await fetch(url, { redirect: "follow" });
  const type = (res.headers.get("content-type") || "").split(";")[0];
  if (!res.ok || !type.startsWith("image/")) {
    throw new Error(`unduh gagal (${res.status} ${type})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 5000) throw new Error("file terlalu kecil");
  return { buffer, contentType: type };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.db.collection("products");
  console.log("MongoDB terhubung, mengambil katalog DummyJSON...");
  const djImages = await fetchDummyJsonImages();

  // cache: URL sumber yang sama hanya diunduh sekali
  const cache = new Map();
  let updated = 0;
  let failed = 0;

  for (const [name, src] of Object.entries(MAPPING)) {
    const product = await col.findOne({ name, imageUrl: /\.svg$/ });
    if (!product) {
      console.log(`- Lewati (tidak ditemukan / sudah foto): ${name}`);
      continue;
    }

    const sourceUrl = src.dj ? djImages[src.dj] : unsplash(src.us);
    if (!sourceUrl) {
      console.warn(`! Sumber tidak ada untuk: ${name}`);
      failed++;
      continue;
    }

    try {
      let img = cache.get(sourceUrl);
      if (!img) {
        img = await downloadImage(sourceUrl);
        cache.set(sourceUrl, img);
      }
      const ext =
        img.contentType === "image/webp"
          ? ".webp"
          : img.contentType === "image/png"
            ? ".png"
            : ".jpg";
      const objectName = `seedfix/${slug(name)}${ext}`;
      await minio.putObject(BUCKET, objectName, img.buffer, img.buffer.length, {
        "Content-Type": img.contentType,
      });
      const imageUrl = `${MINIO_PUBLIC_URL}/${BUCKET}/${objectName}`;
      await col.updateOne({ _id: product._id }, { $set: { imageUrl } });
      const label = src.dj ? `DummyJSON: ${src.dj}` : "Unsplash";
      console.log(`+ ${name}  <-  ${label}`);
      updated++;
    } catch (err) {
      console.warn(`! Gagal ${name}: ${err.message}`);
      failed++;
    }
  }

  const remaining = await col.countDocuments({ imageUrl: /\.svg$/ });
  console.log(
    `\nSelesai: ${updated} diperbarui, ${failed} gagal, sisa SVG: ${remaining}`,
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
