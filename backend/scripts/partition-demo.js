/**
 * Analisis strategi partisi (sharding) data products.
 * Membandingkan distribusi dokumen antar shard untuk 3 kandidat shard key:
 * range-based (category), hashed(tenantId), dan hashed(_id).
 * Jalankan: node scripts/partition-demo.js
 */
const crypto = require("crypto");
const mongoose = require("mongoose");

const URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/smartcatalog?directConnection=true";
const NUM_SHARDS = 3;

function hashShard(value) {
  const h = crypto.createHash("md5").update(String(value)).digest();
  return h.readUInt32BE(0) % NUM_SHARDS;
}

function distribution(docs, keyFn) {
  const counts = Array(NUM_SHARDS).fill(0);
  for (const d of docs) counts[keyFn(d)]++;
  return counts;
}

// Koefisien variasi: makin kecil = distribusi makin merata.
function imbalance(counts) {
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const sd = Math.sqrt(
    counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length,
  );
  return ((sd / mean) * 100).toFixed(1) + "%";
}

(async () => {
  await mongoose.connect(URI);
  const docs = await mongoose.connection
    .collection("products")
    .find({}, { projection: { category: 1, tenantId: 1 } })
    .toArray();
  console.log(
    `Simulasi sharding ${docs.length} dokumen ke ${NUM_SHARDS} shard\n`,
  );

  const categories = [...new Set(docs.map((d) => d.category))].sort();
  const tenants = [...new Set(docs.map((d) => d.tenantId ?? "default"))];
  console.log(
    `Tenant unik: ${tenants.length} | Kategori unik: ${categories.length}\n`,
  );

  const scenarios = [
    {
      name: "Range-based: category",
      keyFn: (d) => categories.indexOf(d.category) % NUM_SHARDS,
      note: "Rawan hotspot bila satu kategori dominan",
    },
    {
      name: "Hashed: tenantId",
      keyFn: (d) => hashShard(d.tenantId ?? "default"),
      note: "Data locality per tenant; timpang jika tenant sedikit",
    },
    {
      name: "Compound: tenantId + hashed(_id)",
      keyFn: (d) => hashShard(`${d.tenantId ?? "default"}:${d._id}`),
      note: "Merata sekaligus query per-tenant tetap targeted",
    },
    {
      name: "Hashed: _id",
      keyFn: (d) => hashShard(d._id),
      note: "Paling merata, tapi query per-tenant menyebar (scatter-gather)",
    },
  ];

  const rows = scenarios.map(({ name, keyFn, note }) => {
    const counts = distribution(docs, keyFn);
    return {
      "Shard key": name,
      shard0: counts[0],
      shard1: counts[1],
      shard2: counts[2],
      ketimpangan: imbalance(counts),
      catatan: note,
    };
  });
  console.table(rows);

  if (tenants.length === 1) {
    console.log(
      "\nAnalisis: dataset saat ini bertenant tunggal, sehingga hashed(tenantId)\n" +
        "menumpuk di satu shard. Rekomendasi: compound key { tenantId: 1, _id: 'hashed' }\n" +
        "— distribusi merata sejak awal dan tetap targeted per tenant saat tenant bertambah.\n" +
        "Perintah produksi: sh.shardCollection('smartcatalog.products', { tenantId: 1, _id: 'hashed' })",
    );
  } else {
    console.log(
      "\nRekomendasi: hashed(tenantId) — seimbang antar shard dan query katalog per\n" +
        "tenant tetap terarah ke satu shard (targeted query, bukan scatter-gather).\n" +
        "Perintah produksi: sh.shardCollection('smartcatalog.products', { tenantId: 'hashed' })",
    );
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
