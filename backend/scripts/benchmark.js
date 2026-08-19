/**
 * Load test evaluasi kinerja: MongoDB tanpa cache vs dengan Redis cache.
 * Prasyarat: backend jalan di http://localhost:3001 dan Redis aktif.
 * Jalankan: node scripts/benchmark.js
 */
const autocannon = require("autocannon");

const BASE = process.env.API_URL || "http://localhost:3001/api/v1";
const DURATION = Number(process.env.DURATION) || 10;
const CONNECTIONS = Number(process.env.CONNECTIONS) || 20;

function fmt(n) {
  return Number(n).toLocaleString("id-ID");
}

async function bench(title, url) {
  // warm-up 1 request (isi cache untuk skenario cached)
  await fetch(url);
  const r = await autocannon({
    url,
    connections: CONNECTIONS,
    duration: DURATION,
  });
  console.log(`\n=== ${title} ===`);
  console.log(`URL           : ${url}`);
  console.log(`Requests/sec  : ${fmt(r.requests.average)}`);
  console.log(`Latency p50   : ${r.latency.p50} ms`);
  console.log(`Latency p95   : ${r.latency.p97_5 ?? r.latency.p95} ms`);
  console.log(`Latency p99   : ${r.latency.p99} ms`);
  console.log(`Errors        : ${r.errors} | Non-2xx: ${r.non2xx}`);
  return {
    skenario: title,
    "req/s": Math.round(r.requests.average),
    "p50 (ms)": r.latency.p50,
    "p99 (ms)": r.latency.p99,
  };
}

(async () => {
  console.log(`Load test: ${CONNECTIONS} koneksi, ${DURATION}s per skenario\n`);
  const rows = [];
  rows.push(
    await bench(
      "Skenario A: MongoDB langsung (tanpa cache)",
      `${BASE}/products?nocache=1`,
    ),
  );
  rows.push(await bench("Skenario B: Dengan Redis cache", `${BASE}/products`));
  rows.push(
    await bench(
      "Skenario C: Filter kategori + cache",
      `${BASE}/products?category=Laptop`,
    ),
  );
  console.log("\n=== RINGKASAN ===");
  console.table(rows);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
