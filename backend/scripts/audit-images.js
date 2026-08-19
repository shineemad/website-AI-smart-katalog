/** Audit gambar produk: kosong, SVG placeholder, atau foto asli. */
const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/smartcatalog",
  );
  const col = mongoose.connection.db.collection("products");

  const empty = await col.countDocuments({
    $or: [
      { imageUrl: "" },
      { imageUrl: null },
      { imageUrl: { $exists: false } },
    ],
  });
  const svg = await col.countDocuments({ imageUrl: /\.svg$/ });
  const photo = await col.countDocuments({
    imageUrl: /\.(jpg|jpeg|webp|png)$/i,
  });

  console.log(`kosong          : ${empty}`);
  console.log(`placeholder SVG : ${svg}`);
  console.log(`foto asli       : ${photo}`);

  const emptyDocs = await col
    .find(
      {
        $or: [
          { imageUrl: "" },
          { imageUrl: null },
          { imageUrl: { $exists: false } },
        ],
      },
      { projection: { name: 1, category: 1 } },
    )
    .limit(20)
    .toArray();
  if (emptyDocs.length) {
    console.log("\nContoh produk tanpa gambar:");
    emptyDocs.forEach((d) => console.log(` - [${d.category}] ${d.name}`));
  }

  const svgDocs = await col
    .find({ imageUrl: /\.svg$/ }, { projection: { name: 1, category: 1 } })
    .limit(10)
    .toArray();
  if (svgDocs.length) {
    console.log("\nContoh produk placeholder SVG:");
    svgDocs.forEach((d) => console.log(` - [${d.category}] ${d.name}`));
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
