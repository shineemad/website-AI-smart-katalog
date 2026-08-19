/**
 * Script one-off: generate 1000 produk dengan foto asli.
 * Pool foto per kategori diunduh dari Unsplash (sekali), tiap produk
 * mendapat salinan objek sendiri di MinIO, data disimpan ke MongoDB.
 * Jalankan: node scripts/add-bulk-products.js
 */
const Minio = require("minio");
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smartcatalog";
const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
const BUCKET = process.env.MINIO_BUCKET || "products";
const PER_CATEGORY = 200; // 5 kategori x 200 = 1000

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

// ---------- util ----------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260801);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
/** bulatkan ke ribuan cantik: 7.499.000 */
const nicePrice = (p) => Math.max(99000, Math.round(p / 10000) * 10000 - 1000);

// ---------- pool foto asli per kategori ----------
const unsplash = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const IMAGE_POOL_SOURCES = {
  Laptop: [
    "photo-1496181133206-80ce9b88a853",
    "photo-1531297484001-80022131f5a1",
    "photo-1541807084-5c52b6b3adef",
    "photo-1517336714731-489689fd1ca8",
    "photo-1588872657578-7efd1f1555ed",
    "photo-1611186871348-b1ce696e52c9",
    "photo-1603302576837-37561b2e2302",
    "photo-1593642632823-8f785ba67e45",
    "photo-1484788984921-03950022c9ef",
    "photo-1515343480029-43cdfe6b6aae",
  ],
  Smartphone: [
    "photo-1511707171634-5f897ff02aa9",
    "photo-1510557880182-3d4d3cba35a5",
    "photo-1592750475338-74b7b21085ab",
    "photo-1580910051074-3eb694886505",
    "photo-1567581935884-3349723552ca",
    "photo-1601784551446-20c9e07cdbdb",
    "photo-1523206489230-c012c64b2b48",
    "photo-1574944985070-8f3ebc6b79d2",
    "photo-1533228100845-08145b01de14",
  ],
  Tablet: [
    "photo-1544244015-0df4b3ffc6b0",
    "photo-1561154464-82e9adf32764",
    "photo-1585790050230-5dd28404ccb9",
    "photo-1546054454-aa26e2b734c7",
    "photo-1587033411391-5d9e51cce126",
    "photo-1611532736597-de2d4265fba3",
  ],
  Monitor: [
    "photo-1527443224154-c4a3942d3acf",
    "photo-1593640408182-31c70c8268f5",
    "photo-1547082299-de196ea013d6",
    "photo-1551645120-d70bfe84c826",
    "photo-1585792180666-f7347c490ee2",
    "photo-1616763355603-9755a640a287",
    "photo-1587831990711-23ca6441447b",
  ],
  Aksesoris: [
    "photo-1505740420928-5e560c06d30e",
    "photo-1546868871-7041f2a55e12",
    "photo-1523275335684-37898b6baf30",
    "photo-1527864550417-7fd91fc51a46",
    "photo-1587829741301-dc798b83add3",
    "photo-1572569511254-d8f925fe2cbb",
    "photo-1583394838336-acd977736f90",
    "photo-1600294037681-c80b4cb5b434",
    "photo-1618366712010-f4ae9c647dcb",
  ],
};

async function downloadPool() {
  const pool = {};
  for (const [category, ids] of Object.entries(IMAGE_POOL_SOURCES)) {
    pool[category] = [];
    for (const id of ids) {
      try {
        const res = await fetch(unsplash(id), { redirect: "follow" });
        const type = (res.headers.get("content-type") || "").split(";")[0];
        if (!res.ok || !type.startsWith("image/")) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 10_000) continue;
        pool[category].push({ buffer: buf, contentType: type });
        process.stdout.write(".");
      } catch {
        /* skip foto yang gagal */
      }
    }
    console.log(` ${category}: ${pool[category].length} foto`);
    if (pool[category].length === 0)
      throw new Error(`Pool foto kosong untuk kategori ${category}`);
  }
  return pool;
}

// ---------- generator produk ----------
const LAPTOP_SERIES = {
  ASUS: [
    "VivoBook 14",
    "VivoBook 15",
    "ZenBook 14 OLED",
    "TUF Gaming A15",
    "ROG Strix G16",
  ],
  Acer: ["Aspire 5", "Swift Go 14", "Nitro V 15", "Predator Helios Neo 16"],
  Lenovo: [
    "IdeaPad Slim 3",
    "IdeaPad Slim 5",
    "ThinkPad E14",
    "LOQ 15",
    "Legion 5",
  ],
  HP: ["Pavilion 14", "Victus 15", "Envy x360 14", "Omen 16"],
  Dell: ["Inspiron 14", "Vostro 15", "XPS 13", "G15"],
  MSI: ["Modern 14", "Thin GF63", "Katana 15", "Cyborg 15"],
  Apple: ["MacBook Air 13", "MacBook Air 15", "MacBook Pro 14"],
  Samsung: ["Galaxy Book4", "Galaxy Book4 Pro"],
  LG: ["Gram 14", "Gram 16"],
  Infinix: ["INBook X3 Slim", "INBook Y2 Plus"],
};
const CPUS = [
  ["Intel Core i3-1315U", 0],
  ["Intel Core i5-1334U", 15],
  ["Intel Core i5-13420H", 18],
  ["Intel Core i7-1355U", 30],
  ["Intel Core i7-13620H", 35],
  ["Intel Core Ultra 5 125H", 40],
  ["AMD Ryzen 3 7320U", 0],
  ["AMD Ryzen 5 7530U", 14],
  ["AMD Ryzen 5 8645HS", 22],
  ["AMD Ryzen 7 7735HS", 32],
  ["AMD Ryzen 7 8845HS", 42],
];
const LAPTOP_GPUS = [
  ["Integrated Graphics", 0],
  ["Intel Iris Xe", 3],
  ["NVIDIA RTX 2050 4GB", 15],
  ["NVIDIA RTX 3050 6GB", 25],
  ["NVIDIA RTX 4050 6GB", 45],
  ["NVIDIA RTX 4060 8GB", 65],
];

function genLaptop() {
  const brand = pick(Object.keys(LAPTOP_SERIES));
  const series = pick(LAPTOP_SERIES[brand]);
  const isApple = brand === "Apple";
  const cpu = isApple
    ? [pick(["Apple M3 8-core", "Apple M4 10-core"]), 60]
    : pick(CPUS);
  const gpu = isApple ? ["GPU terintegrasi Apple", 0] : pick(LAPTOP_GPUS);
  const ram = pick(["8GB", "16GB", "16GB", "32GB"]);
  const storage = pick(["256GB", "512GB", "512GB", "1TB"]);
  const display = pick([
    '14" FHD IPS',
    '14" FHD IPS 60Hz',
    '15.6" FHD 144Hz',
    '15.6" FHD IPS anti-glare',
    '14" 2.8K OLED 90Hz',
    '16" WUXGA 165Hz',
    '13.6" Liquid Retina',
  ]);
  const base = isApple ? 15000000 : 6000000;
  const price =
    base +
    cpu[1] * 100000 +
    gpu[1] * 100000 +
    (ram === "32GB" ? 3000000 : ram === "16GB" ? 1200000 : 0) +
    (storage === "1TB" ? 1500000 : storage === "512GB" ? 500000 : 0) +
    rng() * 1500000;
  const cpuShort = cpu[0]
    .replace(/^(Intel Core|AMD Ryzen \d|Apple) ?/, "")
    .split(" ")[0];
  return {
    name: `Laptop ${brand} ${series} ${cpuShort} ${ram}/${storage}`,
    category: "Laptop",
    price: nicePrice(price),
    specs: {
      processor: cpu[0],
      ram: `${ram} ${isApple ? "Unified" : pick(["DDR4", "DDR5", "LPDDR5"])}`,
      storage: `${storage} NVMe SSD`,
      display,
      gpu: gpu[0],
      weight: `${(1.2 + rng() * 1.4).toFixed(2)} kg`,
      battery: `${pick(["42Wh", "50Wh", "56Wh", "70Wh", "90Wh"])}, hingga ${Math.floor(5 + rng() * 13)} jam`,
    },
  };
}

const PHONE_SERIES = {
  Samsung: [
    "Galaxy A16",
    "Galaxy A26",
    "Galaxy A36",
    "Galaxy A56",
    "Galaxy S24 FE",
    "Galaxy S25",
    "Galaxy M15 5G",
  ],
  Xiaomi: [
    "Redmi 13C",
    "Redmi Note 13",
    "Redmi Note 14 Pro",
    "Poco X6 Pro",
    "Poco F6",
    "Xiaomi 14T",
  ],
  Apple: ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "iPhone 16 Pro"],
  OPPO: ["A18", "A3 Pro", "Reno 11 F", "Reno 12", "Find X8"],
  vivo: ["Y19s", "Y28", "V30e", "V40", "X100"],
  realme: ["C61", "C65", "Narzo 70", "12 Pro+", "GT 6"],
  Infinix: ["Hot 50", "Note 40", "Zero 30"],
  Tecno: ["Spark 20 Pro", "Camon 30"],
  Honor: ["X6b", "200 Lite", "Magic6 Lite"],
};

function genPhone() {
  const brand = pick(Object.keys(PHONE_SERIES));
  const series = pick(PHONE_SERIES[brand]);
  const isApple = brand === "Apple";
  const isFlagship = /Pro|Ultra|X100|Find|GT 6|S25|14T/.test(series) || isApple;
  const ram = isApple
    ? pick(["6GB", "8GB"])
    : pick(["4GB", "6GB", "8GB", "8GB", "12GB"]);
  const storage = pick(
    isFlagship ? ["128GB", "256GB", "512GB"] : ["64GB", "128GB", "256GB"],
  );
  const base = isApple ? 9000000 : isFlagship ? 5000000 : 1400000;
  const price =
    base +
    (ram === "12GB" ? 1500000 : ram === "8GB" ? 800000 : 0) +
    (storage === "512GB" ? 2500000 : storage === "256GB" ? 1000000 : 0) +
    rng() * 2000000;
  return {
    name: `Smartphone ${brand} ${series} ${ram}/${storage}`,
    category: "Smartphone",
    price: nicePrice(price),
    specs: {
      chipset: isApple
        ? pick([
            "Apple A15 Bionic",
            "Apple A16 Bionic",
            "Apple A17 Pro",
            "Apple A18",
          ])
        : pick([
            "Snapdragon 4 Gen 2",
            "Snapdragon 6 Gen 1",
            "Snapdragon 7s Gen 2",
            "Snapdragon 8s Gen 3",
            "Dimensity 6300",
            "Dimensity 7300",
            "Dimensity 8300 Ultra",
            "Helio G99",
          ]),
      ram,
      storage,
      display: pick([
        '6.1" OLED 60Hz',
        '6.5" IPS 90Hz',
        '6.6" AMOLED 120Hz',
        '6.7" AMOLED 120Hz',
        '6.78" AMOLED 144Hz',
      ]),
      kamera: pick([
        "50MP utama + 2MP depth",
        "50MP OIS + 8MP ultrawide",
        "64MP utama + 8MP ultrawide",
        "108MP utama + 8MP ultrawide",
        "48MP utama + 12MP ultrawide",
      ]),
      baterai: `${pick(["4500", "5000", "5000", "5500", "6000"])} mAh, pengisian ${pick(["18W", "33W", "45W", "67W", "80W"])}`,
    },
  };
}

const TABLET_SERIES = {
  Samsung: [
    "Galaxy Tab A9",
    "Galaxy Tab A9+",
    "Galaxy Tab S9 FE",
    "Galaxy Tab S10+",
  ],
  Apple: ["iPad 10", "iPad Air 11", "iPad Pro 11"],
  Xiaomi: ["Pad 6", "Redmi Pad SE", "Pad 7"],
  Huawei: ["MatePad 11.5", "MatePad SE 10.4"],
  Lenovo: ["Tab M10 Gen 3", "Tab M11", "Tab P12"],
  OPPO: ["Pad Air 2", "Pad Neo"],
  Honor: ["Pad 9", "Pad X9"],
  Advan: ["Tab VX Lite", "Sketsa 3"],
};

function genTablet() {
  const brand = pick(Object.keys(TABLET_SERIES));
  const series = pick(TABLET_SERIES[brand]);
  const isApple = brand === "Apple";
  const isPro = /Pro|S9|S10|P12|Pad 7/.test(series) || isApple;
  const conn = pick(["WiFi", "WiFi", "WiFi + Cellular"]);
  const storage = pick(isPro ? ["128GB", "256GB"] : ["64GB", "128GB"]);
  const base = isApple ? 6500000 : isPro ? 4500000 : 1500000;
  const price =
    base +
    (storage === "256GB" ? 1500000 : storage === "128GB" ? 700000 : 0) +
    (conn.includes("Cellular") ? 1200000 : 0) +
    rng() * 1500000;
  return {
    name: `Tablet ${brand} ${series} ${conn} ${storage}`,
    category: "Tablet",
    price: nicePrice(price),
    specs: {
      chipset: isApple
        ? pick(["Apple A14 Bionic", "Apple M2", "Apple M4"])
        : pick([
            "Snapdragon 680",
            "Snapdragon 7+ Gen 3",
            "Helio G99",
            "Dimensity 6100+",
            "Exynos 1380",
            "Kirin 710A",
          ]),
      ram: pick(["4GB", "6GB", "8GB"]),
      storage: `${storage}${isApple ? "" : ", slot microSD"}`,
      display: pick([
        '10.4" IPS 60Hz',
        '10.9" IPS 90Hz',
        '11" IPS 90Hz',
        '11" AMOLED 120Hz',
        '12.4" IPS 90Hz',
      ]),
      konektivitas: conn,
      baterai: `${pick(["7040", "8000", "8400", "10090"])} mAh`,
      fitur: pick([
        "Dukungan stylus",
        "Mode anak & split screen",
        "Quad speaker Dolby Atmos",
        "Sertifikasi TUV low blue light",
      ]),
    },
  };
}

const MONITOR_BRANDS = {
  LG: ["UltraGear", "UltraFine", "MyView"],
  Samsung: ["Odyssey G4", "Odyssey G5", "ViewFinity S6", "Essential S3"],
  AOC: ["24G2SP", "27G2E", "Q27G3XMN", "CU34G2X"],
  ASUS: ["TUF Gaming VG249", "ProArt PA248", "ROG Strix XG27"],
  Acer: ["Nitro VG240Y", "Nitro XV272U", "Predator XB273"],
  Dell: ["S2421H", "S2721DGF", "UltraSharp U2723QE"],
  ViewSonic: ["VX2428", "VX2758A", "VP2768"],
  MSI: ["G244F", "MAG 274QRF", "MPG 321URX"],
  Xiaomi: ["A24i", "G27i", "Redmi 27 Pro"],
  BenQ: ["GW2490", "MOBIUZ EX2710", "PD2705U"],
};

function genMonitor() {
  const brand = pick(Object.keys(MONITOR_BRANDS));
  const series = pick(MONITOR_BRANDS[brand]);
  const size = pick(["21.45", "23.8", "23.8", "27", "27", "31.5", "34"]);
  const res = pick(["FHD 1080p", "FHD 1080p", "QHD 1440p", "4K UHD"]);
  const refresh = pick(["75", "100", "144", "165", "180"]);
  const panel = pick(["IPS", "IPS", "VA", "Fast IPS"]);
  const price =
    900000 +
    Number(size) * 45000 +
    (res.startsWith("QHD") ? 1500000 : res.startsWith("4K") ? 3500000 : 0) +
    Number(refresh) * 6000 +
    rng() * 900000;
  return {
    name: `Monitor ${brand} ${series} ${size}" ${res.split(" ")[0]} ${refresh}Hz`,
    category: "Monitor",
    price: nicePrice(price),
    specs: {
      panel: `${size} inci ${panel} ${res}`,
      refresh: `${refresh}Hz, ${pick(["1ms MPRT", "4ms GtG", "0.5ms MPRT"])}`,
      sync: pick([
        "FreeSync",
        "FreeSync Premium",
        "G-Sync Compatible",
        "Adaptive-Sync",
      ]),
      warna: pick([
        "sRGB 99%",
        "sRGB 120%",
        "DCI-P3 90%",
        "DCI-P3 95%, HDR400",
      ]),
      konektivitas: pick([
        "HDMI, VGA",
        "HDMI 2.0, DisplayPort 1.2",
        "2x HDMI, DisplayPort, USB-C 65W",
      ]),
      fitur: pick([
        "Flicker Free, Low Blue Light",
        "Bisa pivot & atur tinggi",
        "Speaker built-in 2x3W",
        "VESA 100x100",
      ]),
    },
  };
}

const ACC_TYPES = [
  {
    type: "TWS",
    brands: [
      "JBL Wave",
      "Samsung Galaxy Buds",
      "Sony WF-C",
      "Anker Soundcore R",
      "Baseus Bowie",
      "realme Buds Air",
      "Edifier W",
    ],
    base: 250000,
    spread: 1800000,
    specs: () => ({
      tipe: "True Wireless Stereo",
      baterai: `hingga ${Math.floor(20 + rng() * 20)} jam dengan case`,
      anc: pick(["Ya, hybrid ANC", "Tidak"]),
      codec: pick(["SBC, AAC", "SBC, AAC, LDAC"]),
      ketahanan: pick(["IPX4", "IPX5", "IP55"]),
    }),
  },
  {
    type: "Headphone",
    brands: [
      "Sony WH-CH",
      "JBL Tune",
      "Audio-Technica ATH-M",
      "Edifier WH",
      "Anker Soundcore Life Q",
    ],
    base: 400000,
    spread: 3500000,
    specs: () => ({
      tipe: "Over-ear wireless",
      baterai: `hingga ${Math.floor(30 + rng() * 40)} jam`,
      anc: pick(["Ya", "Tidak"]),
      driver: pick(["30mm", "40mm", "45mm"]),
      fitur: pick(["Multipoint 2 perangkat", "Mode kabel 3.5mm", "Fast pair"]),
    }),
  },
  {
    type: "Keyboard",
    brands: [
      "Keychron K",
      "Fantech Maxfit",
      "Rexus Daxa M",
      "Logitech K",
      "Royal Kludge RK",
      "Ajazz AK",
    ],
    base: 250000,
    spread: 1600000,
    specs: () => ({
      layout: pick(["60%", "65%", "75%", "TKL", "Full-size"]),
      switch: pick([
        "Gateron Red",
        "Gateron Brown",
        "Outemu Blue",
        "Red linear hot-swap",
      ]),
      koneksi: pick([
        "Kabel USB-C",
        "Bluetooth + 2.4GHz + kabel",
        "Bluetooth 5.1",
      ]),
      backlight: pick(["RGB", "White LED", "Tanpa backlight"]),
    }),
  },
  {
    type: "Mouse",
    brands: [
      "Logitech G",
      "Razer DeathAdder",
      "Fantech Helios",
      "Rexus Xierra",
      "SteelSeries Rival",
      "Attack Shark X",
    ],
    base: 150000,
    spread: 1400000,
    specs: () => ({
      sensor: `${pick(["8000", "12000", "16000", "26000"])} DPI optik`,
      koneksi: pick(["Kabel", "Wireless 2.4GHz", "Bluetooth + 2.4GHz"]),
      berat: `${Math.floor(55 + rng() * 60)} gram`,
      fitur: pick([
        "6 tombol programmable",
        "RGB, onboard memory",
        "Silent click",
      ]),
    }),
  },
  {
    type: "Powerbank",
    brands: [
      "Anker PowerCore",
      "Baseus Adaman",
      "Xiaomi Pocket",
      "Aukey Basix",
      "Veger V",
    ],
    base: 150000,
    spread: 700000,
    specs: () => ({
      kapasitas: pick(["10000 mAh", "10000 mAh", "20000 mAh", "30000 mAh"]),
      output: pick(["18W PD", "22.5W", "30W PD", "65W PD"]),
      port: pick(["1x USB-A, 1x USB-C", "2x USB-A, 1x USB-C"]),
      fitur: pick(["Layar digital", "Fast charging dua arah", "Slim & ringan"]),
    }),
  },
  {
    type: "SSD Eksternal",
    brands: [
      "Samsung T",
      "SanDisk Extreme",
      "WD My Passport",
      "Kingston XS",
      "ADATA SE",
    ],
    base: 800000,
    spread: 2500000,
    specs: () => ({
      kapasitas: pick(["500GB", "1TB", "1TB", "2TB"]),
      kecepatan: pick(["baca 550MB/s", "baca 1050MB/s", "baca 2000MB/s"]),
      koneksi: "USB-C 3.2",
      ketahanan: pick([
        "Tahan guncangan",
        "IP55 tahan debu & air",
        "Bodi aluminium",
      ]),
    }),
  },
  {
    type: "Webcam",
    brands: ["Logitech C", "Razer Kiyo", "AverMedia PW", "NexiGo N"],
    base: 300000,
    spread: 1800000,
    specs: () => ({
      resolusi: pick(["720p 30fps", "1080p 30fps", "1080p 60fps", "2K 30fps"]),
      fokus: pick(["Fixed focus", "Autofocus"]),
      mikrofon: pick(["Mono", "Stereo dual-mic"]),
      fitur: pick([
        "Privacy shutter",
        "Ring light built-in",
        "Auto light correction",
      ]),
    }),
  },
  {
    type: "Speaker Bluetooth",
    brands: [
      "JBL Go",
      "JBL Flip",
      "Sony SRS-XB",
      "Anker Soundcore Motion",
      "Harman Kardon Onyx",
    ],
    base: 300000,
    spread: 2800000,
    specs: () => ({
      output: pick(["5W", "10W", "20W", "30W"]),
      baterai: `hingga ${Math.floor(8 + rng() * 16)} jam`,
      ketahanan: pick(["IPX7 tahan air", "IP67 tahan debu & air"]),
      fitur: pick([
        "Party pairing",
        "TWS pairing 2 speaker",
        "Mic speakerphone",
      ]),
    }),
  },
  {
    type: "Smartwatch",
    brands: [
      "Amazfit Bip",
      "Huawei Watch Fit",
      "Samsung Galaxy Fit",
      "Xiaomi Smart Band",
      "Aukey Fitnest",
    ],
    base: 250000,
    spread: 2500000,
    specs: () => ({
      display: pick(['1.47" AMOLED', '1.62" AMOLED', '1.96" AMOLED']),
      sensor: "Detak jantung, SpO2, tidur",
      baterai: `hingga ${Math.floor(7 + rng() * 14)} hari`,
      ketahanan: pick(["5ATM", "IP68"]),
      fitur: pick([
        "GPS built-in",
        "120+ mode olahraga",
        "Panggilan Bluetooth",
      ]),
    }),
  },
  {
    type: "Hub USB-C",
    brands: [
      "Ugreen Revodok",
      "Baseus Metal Gleam",
      "Anker PowerExpand",
      "Orico",
    ],
    base: 150000,
    spread: 900000,
    specs: () => ({
      port: pick(["5-in-1", "6-in-1", "8-in-1", "11-in-1"]),
      output: pick(["HDMI 4K30", "HDMI 4K60", "HDMI + VGA"]),
      pd: pick(["PD 60W", "PD 100W"]),
      material: "Aluminium",
    }),
  },
];

function genAccessory() {
  const t = pick(ACC_TYPES);
  const brandSeries = pick(t.brands);
  const modelNum = Math.floor(1 + rng() * 89);
  return {
    name: `${t.type} ${brandSeries}${modelNum}`,
    category: "Aksesoris",
    price: nicePrice(t.base + rng() * t.spread),
    specs: t.specs(),
  };
}

const GENERATORS = {
  Laptop: genLaptop,
  Smartphone: genPhone,
  Tablet: genTablet,
  Monitor: genMonitor,
  Aksesoris: genAccessory,
};

function generateAll(existingNames) {
  const items = [];
  const used = new Set(existingNames);
  for (const [category, gen] of Object.entries(GENERATORS)) {
    let count = 0;
    let guard = 0;
    while (count < PER_CATEGORY && guard < PER_CATEGORY * 60) {
      guard++;
      const p = gen();
      let name = p.name;
      if (used.has(name)) {
        // varian warna untuk membedakan duplikat kombinasi
        const variant = pick([
          "Hitam",
          "Silver",
          "Abu-abu",
          "Biru",
          "Putih",
          "Gold",
          "Hijau",
          "Ungu",
        ]);
        name = `${p.name} ${variant}`;
        if (used.has(name)) continue;
      }
      used.add(name);
      items.push({ ...p, name, category });
      count++;
    }
    if (count < PER_CATEGORY)
      throw new Error(`Hanya berhasil generate ${count} untuk ${category}`);
  }
  return items;
}

// ---------- main ----------
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB terhubung");

  console.log("Mengunduh pool foto asli dari Unsplash...");
  const pool = await downloadPool();

  const existing = await Product.find({}, { name: 1 }).lean();
  const items = generateAll(existing.map((p) => p.name));
  console.log(`${items.length} produk siap diproses\n`);

  let done = 0;
  const CHUNK = 25;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const docs = await Promise.all(
      chunk.map(async (item, j) => {
        const img =
          pool[item.category][Math.floor(rng() * pool[item.category].length)];
        const ext = img.contentType === "image/png" ? ".png" : ".jpg";
        const objectName = `${slug(item.name)}-${i + j}${ext}`;
        await minio.putObject(
          BUCKET,
          objectName,
          img.buffer,
          img.buffer.length,
          {
            "Content-Type": img.contentType,
          },
        );
        return {
          name: item.name,
          category: item.category,
          price: item.price,
          imageUrl: `${MINIO_PUBLIC_URL}/${BUCKET}/${objectName}`,
          specs: item.specs,
          tenantId: "default",
        };
      }),
    );
    await Product.insertMany(docs);
    done += docs.length;
    process.stdout.write(`\rProgress: ${done}/${items.length}`);
  }

  const total = await Product.countDocuments();
  console.log(`\n\nSelesai. Total produk di MongoDB: ${total}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
