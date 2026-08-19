/**
 * Analisis query plan MongoDB: COLLSCAN (tanpa index) vs IXSCAN (dengan index).
 * Jalankan: node scripts/explain-queries.js
 */
const mongoose = require("mongoose");

const URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/smartcatalog?directConnection=true";

function summarize(label, explain) {
  const stats = explain.executionStats;
  console.log(`\n=== ${label} ===`);
  console.log(
    `Stage         : ${planStages(explain.queryPlanner.winningPlan)}`,
  );
  console.log(`Docs examined : ${stats.totalDocsExamined}`);
  console.log(`Keys examined : ${stats.totalKeysExamined}`);
  console.log(`Docs returned : ${stats.nReturned}`);
  console.log(`Waktu eksekusi: ${stats.executionTimeMillis} ms`);
}

function planStages(plan, acc = []) {
  acc.push(plan.stage);
  if (plan.inputStage) planStages(plan.inputStage, acc);
  if (plan.inputStages) plan.inputStages.forEach((s) => planStages(s, acc));
  return acc.join(" <- ");
}

(async () => {
  await mongoose.connect(URI);
  const col = mongoose.connection.collection("products");

  const total = await col.countDocuments();
  console.log(`Koleksi products: ${total} dokumen`);
  console.log(`Index tersedia  :`);
  (await col.indexes()).forEach((i) =>
    console.log(`  - ${i.name}: ${JSON.stringify(i.key)}`),
  );

  const sample = await col.findOne({});
  const category = sample?.category ?? "Laptop";
  const query = { category };
  const sort = { category: 1, createdAt: -1 };

  // Skenario 1: paksa full collection scan (kondisi "sebelum index")
  const collscan = await col
    .find(query)
    .sort(sort)
    .hint({ $natural: 1 })
    .explain("executionStats");
  summarize(`Query kategori "${category}" TANPA index (COLLSCAN)`, collscan);

  // Skenario 2: biarkan planner memakai compound index (kondisi "sesudah index")
  const ixscan = await col.find(query).sort(sort).explain("executionStats");
  summarize(`Query kategori "${category}" DENGAN index (IXSCAN)`, ixscan);

  // Skenario 3: range harga memakai index price
  const range = await col
    .find({ price: { $gte: 1_000_000, $lte: 20_000_000 } })
    .explain("executionStats");
  summarize("Query rentang harga DENGAN index price", range);

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
