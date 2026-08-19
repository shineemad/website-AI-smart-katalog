/**
 * Verifikasi replikasi MongoDB replica set rs0 (3 node).
 * Membuktikan: status anggota, write ke PRIMARY terbaca di SECONDARY, dan replication lag.
 * Jalankan: node scripts/replication-status.js
 */
const { MongoClient } = require("mongodb");

const PRIMARY_URI = "mongodb://localhost:27017/?directConnection=true";
const SECONDARY_URI =
  "mongodb://localhost:27018/?directConnection=true&readPreference=secondaryPreferred";
const DB = "smartcatalog";

(async () => {
  const primary = new MongoClient(PRIMARY_URI);
  const secondary = new MongoClient(SECONDARY_URI);
  await primary.connect();
  await secondary.connect();

  // 1. Status anggota replica set
  const status = await primary.db("admin").command({ replSetGetStatus: 1 });
  console.log(`=== Replica Set "${status.set}" ===`);
  for (const m of status.members) {
    const lag =
      m.stateStr === "SECONDARY"
        ? ` (lag: ${(status.members[0].optimeDate - m.optimeDate) / 1000}s)`
        : "";
    console.log(
      `  ${m.name.padEnd(30)} ${m.stateStr}${lag} health=${m.health}`,
    );
  }

  // 2. Bukti replikasi: tulis ke PRIMARY, baca dari SECONDARY
  const marker = { _id: `repl-test-${Date.now()}`, at: new Date() };
  await primary.db(DB).collection("replication_test").insertOne(marker);
  console.log(`\nWrite ke PRIMARY   : ${marker._id}`);

  let found = null;
  const start = Date.now();
  while (!found && Date.now() - start < 5000) {
    found = await secondary
      .db(DB)
      .collection("replication_test")
      .findOne({ _id: marker._id });
  }
  console.log(
    found
      ? `Read dari SECONDARY: ${found._id} (tereplikasi dalam ${Date.now() - start} ms)`
      : "Read dari SECONDARY: GAGAL (tidak tereplikasi dalam 5s)",
  );

  // 3. Jumlah dokumen products di primary vs secondary (bukti data identik)
  const cp = await primary.db(DB).collection("products").countDocuments();
  const cs = await secondary.db(DB).collection("products").countDocuments();
  console.log(`\nproducts di PRIMARY  : ${cp} dokumen`);
  console.log(`products di SECONDARY: ${cs} dokumen`);
  console.log(
    cp === cs ? "=> Konsisten ✔" : "=> Belum sinkron (eventual consistency)",
  );

  await primary
    .db(DB)
    .collection("replication_test")
    .deleteOne({ _id: marker._id });
  await primary.close();
  await secondary.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
