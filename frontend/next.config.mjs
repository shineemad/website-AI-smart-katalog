/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy objek MinIO lewat origin frontend agar gambar tetap tampil
    // saat situs diakses dari perangkat lain (URL DB memakai localhost:9000)
    const minio = process.env.MINIO_INTERNAL_URL || "http://localhost:9000";
    return [{ source: "/media/:path*", destination: `${minio}/:path*` }];
  },
};

export default nextConfig;
