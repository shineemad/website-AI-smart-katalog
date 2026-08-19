/**
 * Script one-off: tambah produk baru dengan foto asli.
 * Foto diunduh dari Unsplash CDN -> upload ke MinIO -> data ke MongoDB.
 * Jalankan: node scripts/add-products.js
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

const unsplash = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

// Fallback per kategori bila URL utama gagal diunduh
const CATEGORY_FALLBACKS = {
  Laptop: [
    unsplash("photo-1541807084-5c52b6b3adef"),
    unsplash("photo-1531297484001-80022131f5a1"),
  ],
  Smartphone: [
    unsplash("photo-1510557880182-3d4d3cba35a5"),
    unsplash("photo-1511707171634-5f897ff02aa9"),
  ],
  Aksesoris: [
    unsplash("photo-1546868871-7041f2a55e12"),
    unsplash("photo-1505740420928-5e560c06d30e"),
  ],
  Monitor: [
    unsplash("photo-1593640408182-31c70c8268f5"),
    unsplash("photo-1527443224154-c4a3942d3acf"),
  ],
  Tablet: [
    unsplash("photo-1544244015-0df4b3ffc6b0"),
    unsplash("photo-1561154464-82e9adf32764"),
  ],
};

const NEW_PRODUCTS = [
  {
    name: "Laptop Apple MacBook Pro 14 M3",
    category: "Laptop",
    price: 28999000,
    image: unsplash("photo-1517336714731-489689fd1ca8"),
    specs: {
      processor: "Apple M3 Pro 11-core",
      ram: "18GB Unified Memory",
      storage: "512GB SSD",
      display: "14.2 inci Liquid Retina XDR 120Hz",
      gpu: "Apple 14-core GPU",
      weight: "1.55 kg",
      battery: "hingga 18 jam pemutaran video",
    },
  },
  {
    name: "Laptop Dell XPS 13 Plus 9320",
    category: "Laptop",
    price: 21499000,
    image: unsplash("photo-1496181133206-80ce9b88a853"),
    specs: {
      processor: "Intel Core i7-1360P",
      ram: "16GB LPDDR5",
      storage: "512GB NVMe SSD",
      display: "13.4 inci OLED 3.5K sentuh",
      gpu: "Intel Iris Xe",
      weight: "1.26 kg",
      battery: "55Wh, hingga 10 jam",
    },
  },
  {
    name: "Smartphone Apple iPhone 15 Pro",
    category: "Smartphone",
    price: 18999000,
    image: unsplash("photo-1592750475338-74b7b21085ab"),
    specs: {
      chipset: "Apple A17 Pro",
      ram: "8GB",
      storage: "256GB",
      display: "6.1 inci Super Retina XDR 120Hz",
      kamera: "48MP utama + 12MP ultrawide + 12MP tele",
      baterai: "3274 mAh, USB-C",
      material: "Rangka titanium",
    },
  },
  {
    name: "Smartphone Google Pixel 8",
    category: "Smartphone",
    price: 10999000,
    image: unsplash("photo-1511707171634-5f897ff02aa9"),
    specs: {
      chipset: "Google Tensor G3",
      ram: "8GB",
      storage: "128GB",
      display: "6.2 inci OLED 120Hz",
      kamera: "50MP utama + 12MP ultrawide, Magic Eraser",
      baterai: "4575 mAh",
      fitur: "7 tahun update Android",
    },
  },
  {
    name: "Headphone Sony WH-1000XM5",
    category: "Aksesoris",
    price: 4999000,
    image: unsplash("photo-1505740420928-5e560c06d30e"),
    specs: {
      tipe: "Over-ear wireless",
      anc: "Industry-leading Noise Cancelling",
      baterai: "hingga 30 jam dengan ANC",
      codec: "LDAC, AAC, SBC",
      fitur: "Multipoint 2 perangkat, Speak-to-Chat",
      berat: "250 gram",
    },
  },
  {
    name: "Smartwatch Apple Watch Series 9",
    category: "Aksesoris",
    price: 6499000,
    image: unsplash("photo-1523275335684-37898b6baf30"),
    specs: {
      chipset: "Apple S9 SiP",
      display: "Always-On Retina 2000 nits",
      sensor: "EKG, SpO2, suhu kulit",
      baterai: "18 jam pemakaian normal",
      fitur: "Double Tap gesture, Siri on-device",
      ketahanan: "WR50, tahan debu IP6X",
    },
  },
  {
    name: "Keyboard Mekanik Keychron K2 V2",
    category: "Aksesoris",
    price: 1299000,
    image: unsplash("photo-1587829741301-dc798b83add3"),
    specs: {
      layout: "75% (84 tombol)",
      switch: "Gateron Brown hot-swappable",
      koneksi: "Bluetooth 5.1 + kabel USB-C",
      baterai: "4000 mAh, hingga 72 jam",
      backlight: "RGB 18 mode",
      kompatibilitas: "Windows & macOS",
    },
  },
  {
    name: "Mouse Logitech MX Master 3S",
    category: "Aksesoris",
    price: 1599000,
    image: unsplash("photo-1527864550417-7fd91fc51a46"),
    specs: {
      sensor: "8000 DPI, bekerja di kaca",
      klik: "Quiet Click 90% lebih senyap",
      scroll: "MagSpeed elektromagnetik",
      baterai: "70 hari, isi ulang USB-C",
      koneksi: "Bluetooth / Logi Bolt, 3 perangkat",
      ergonomi: "Desain sudut 15 derajat",
    },
  },
  {
    name: "Monitor LG UltraFine 27UN850 4K",
    category: "Monitor",
    price: 7499000,
    image: unsplash("photo-1527443224154-c4a3942d3acf"),
    specs: {
      panel: "27 inci IPS 4K UHD",
      warna: "DCI-P3 95%, HDR400",
      refresh: "60Hz, FreeSync",
      konektivitas: "USB-C 60W PD, 2x HDMI, DisplayPort",
      ergonomi: "Tinggi & pivot bisa diatur",
      fitur: "Speaker stereo 2x5W",
    },
  },
  {
    name: "Monitor Samsung Odyssey G5 32",
    category: "Monitor",
    price: 5299000,
    image: unsplash("photo-1593640408182-31c70c8268f5"),
    specs: {
      panel: "32 inci VA WQHD melengkung 1000R",
      refresh: "165Hz, 1ms MPRT",
      sync: "FreeSync Premium",
      warna: "HDR10, sRGB 99%",
      konektivitas: "HDMI 2.0, DisplayPort 1.2",
      fitur: "Eye Saver Mode, Flicker Free",
    },
  },
  {
    name: "Tablet Apple iPad Air 11 M2",
    category: "Tablet",
    price: 11499000,
    image: unsplash("photo-1544244015-0df4b3ffc6b0"),
    specs: {
      chipset: "Apple M2",
      ram: "8GB",
      storage: "128GB",
      display: "11 inci Liquid Retina",
      kamera: "12MP belakang, 12MP depan landscape",
      aksesori: "Dukungan Apple Pencil Pro & Magic Keyboard",
      baterai: "hingga 10 jam",
    },
  },
  {
    name: "Tablet Samsung Galaxy Tab S9",
    category: "Tablet",
    price: 12999000,
    image: unsplash("photo-1561154464-82e9adf32764"),
    specs: {
      chipset: "Snapdragon 8 Gen 2 for Galaxy",
      ram: "8GB",
      storage: "128GB, slot microSD",
      display: "11 inci Dynamic AMOLED 2X 120Hz",
      spen: "S Pen termasuk dalam paket",
      ketahanan: "IP68 tahan air & debu",
      baterai: "8400 mAh",
    },
  },
];

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

async function downloadImage(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || !type.startsWith("image/")) {
        console.warn(`  gagal (${res.status} ${type}): ${url}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 10_000) {
        console.warn(`  terlalu kecil (${buf.length}B): ${url}`);
        continue;
      }
      return { buffer: buf, contentType: type.split(";")[0] };
    } catch (err) {
      console.warn(`  error unduh: ${err.message}`);
    }
  }
  return null;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB terhubung");

  let created = 0;
  let skipped = 0;
  let noImage = 0;

  for (const item of NEW_PRODUCTS) {
    const exists = await Product.findOne({ name: item.name }).lean();
    if (exists) {
      console.log(`- Lewati (sudah ada): ${item.name}`);
      skipped++;
      continue;
    }

    console.log(`+ ${item.name}`);
    const candidates = [
      item.image,
      ...(CATEGORY_FALLBACKS[item.category] || []),
    ];
    const img = await downloadImage(candidates);

    let imageUrl = "";
    if (img) {
      const ext = img.contentType === "image/png" ? ".png" : ".jpg";
      const objectName = `${slug(item.name)}${ext}`;
      await minio.putObject(BUCKET, objectName, img.buffer, img.buffer.length, {
        "Content-Type": img.contentType,
      });
      imageUrl = `${MINIO_PUBLIC_URL}/${BUCKET}/${objectName}`;
      console.log(
        `  gambar -> ${imageUrl} (${Math.round(img.buffer.length / 1024)}KB)`,
      );
    } else {
      console.warn("  SEMUA sumber gambar gagal, produk dibuat tanpa gambar");
      noImage++;
    }

    await Product.create({
      name: item.name,
      category: item.category,
      price: item.price,
      imageUrl,
      specs: item.specs,
      tenantId: "default",
    });
    created++;
  }

  console.log(
    `\nSelesai: ${created} dibuat, ${skipped} dilewati, ${noImage} tanpa gambar`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
