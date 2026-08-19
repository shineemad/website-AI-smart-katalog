# SmartCatalog AI

Aplikasi web katalog produk cerdas berbasis SaaS untuk UMKM — dilengkapi asisten AI untuk chat produk dan pencarian semantik. Project ini sekaligus menjadi studi kasus **evaluasi kinerja sistem basis data** (NoSQL MongoDB + In-Memory Redis) dalam skenario industri e-commerce nyata.

## Arsitektur & Teknologi

| Komponen         | Teknologi                        | Peran                                        |
| ---------------- | -------------------------------- | -------------------------------------------- |
| Frontend         | Next.js 14 + Tailwind CSS + GSAP | Katalog publik, dashboard admin, chat widget |
| Backend          | NestJS (REST API + Swagger)      | CRUD produk, autentikasi JWT, rate limiting  |
| Basis data utama | MongoDB 7 — replica set 3 node   | Data produk, user, dan log percakapan AI     |
| In-Memory cache  | Redis 7                          | Cache-aside untuk endpoint katalog (TTL 60s) |
| Object storage   | MinIO (S3-compatible)            | Gambar produk                                |
| AI Engine        | Ollama (LLM lokal)               | Chat produk & pencarian semantik             |
| Orkestrasi       | Docker Compose                   | MongoDB ×3, Redis, MinIO                     |

```
Next.js (3000) ──► NestJS API (3001) ──► MongoDB rs0: PRIMARY (27017)
                        │                       ├─ SECONDARY (27018)
                        │                       └─ SECONDARY (27019)
                        │                Redis (6379)
                        │                MinIO (9000/9001)
                        └──────────────► Ollama (LLM)
```

## Fitur

- Katalog produk publik: pencarian, filter kategori, rentang harga, paginasi
- Dashboard admin: CRUD produk + upload gambar (png/jpeg, maks 5MB)
- Autentikasi JWT (register/login) dengan role admin
- Asisten AI: chat per produk dan pencarian produk berbahasa natural
- Redis cache-aside dengan invalidasi otomatis saat operasi tulis
- Swagger UI untuk dokumentasi API interaktif

## Menjalankan Project

### Prasyarat

- Node.js 18+
- Docker Desktop

### 1. Jalankan infrastruktur (MongoDB replica set, Redis, MinIO)

```bash
docker compose up -d
```

Inisialisasi replica set (hanya sekali, saat pertama kali):

```bash
docker exec smartcatalog-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'host.docker.internal:27017',priority:2},{_id:1,host:'host.docker.internal:27018',priority:1},{_id:2,host:'host.docker.internal:27019',priority:1}]})"
```

### 2. Jalankan backend

```bash
cd backend
npm install
npm run start:dev
```

API tersedia di `http://localhost:3001` — Swagger UI di `http://localhost:3001/api/docs`.

Saat pertama kali berjalan, seed otomatis membuat akun admin (`admin@smartcatalog.test` / `admin123`) dan data produk contoh.

### 3. Jalankan frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000`.

### Environment Variables (opsional)

Semua variabel memiliki default untuk pengembangan lokal:

| Variabel                                | Default                                                        | Keterangan                    |
| --------------------------------------- | -------------------------------------------------------------- | ----------------------------- |
| `MONGODB_URI`                           | `mongodb://localhost:27017/smartcatalog?directConnection=true` | Koneksi MongoDB (primary rs0) |
| `REDIS_URL`                             | `redis://localhost:6379`                                       | Koneksi Redis                 |
| `JWT_SECRET`                            | `dev-secret-change-me`                                         | Ganti di production           |
| `PORT`                                  | `3001`                                                         | Port API                      |
| `CORS_ORIGIN`                           | `http://localhost:3000`                                        | Origin frontend               |
| `MINIO_ENDPOINT` / `MINIO_PORT`         | `localhost` / `9000`                                           | Endpoint MinIO                |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | `minioadmin` / `minioadmin`                                    | Kredensial MinIO              |
| `OLLAMA_URL` / `OLLAMA_MODEL`           | (lihat `ollama.client.ts`)                                     | Endpoint & model LLM          |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`        | `admin@smartcatalog.test` / `admin123`                         | Akun seed admin               |

## Endpoint API Utama

| Method | Endpoint                    | Deskripsi                                |
| ------ | --------------------------- | ---------------------------------------- |
| POST   | `/api/v1/auth/register`     | Registrasi user                          |
| POST   | `/api/v1/auth/login`        | Login, mengembalikan JWT                 |
| GET    | `/api/v1/products`          | Daftar produk (filter, paginasi, cached) |
| GET    | `/api/v1/products/:id`      | Detail produk (cached)                   |
| POST   | `/api/v1/products`          | Tambah produk (admin, multipart)         |
| PATCH  | `/api/v1/products/:id`      | Ubah produk (admin)                      |
| DELETE | `/api/v1/products/:id`      | Hapus produk (admin)                     |
| POST   | `/api/v1/products/:id/chat` | Chat AI tentang produk                   |
| POST   | `/api/v1/ai/search`         | Pencarian produk via AI                  |
| GET    | `/api/v1/health`            | Health check                             |

Parameter khusus: `GET /api/v1/products?nocache=1` melewati Redis cache (dipakai untuk benchmark A/B).

## Evaluasi Kinerja Basis Data

Project ini mengimplementasikan dan mengukur tiga optimasi: **indexing MongoDB**, **In-Memory caching (Redis)**, dan **paginasi**.

### Menjalankan evaluasi

```bash
cd backend

# Analisis query plan: COLLSCAN vs IXSCAN (explain executionStats)
npm run explain

# Load test 3 skenario (autocannon, 20 koneksi, 10 detik/skenario)
npm run benchmark
```

### Hasil pengukuran (1.098 dokumen produk)

**Load test — throughput & latency:**

| Skenario                          | Throughput      | p50      | p99      |
| --------------------------------- | --------------- | -------- | -------- |
| A. MongoDB langsung (tanpa cache) | 575 req/s       | 31 ms    | 69 ms    |
| B. Dengan Redis cache             | **4.945 req/s** | **3 ms** | **9 ms** |
| C. Filter kategori + cache        | 4.857 req/s     | 3 ms     | 10 ms    |

**Query plan — efektivitas index:**

| Kondisi                                | Stage           | Docs Examined | Docs Returned |
| -------------------------------------- | --------------- | ------------- | ------------- |
| Tanpa index                            | SORT ← COLLSCAN | 1.098         | 217           |
| Compound index `{category, createdAt}` | FETCH ← IXSCAN  | 217           | 217           |

**Kesimpulan:** Redis cache meningkatkan throughput ±8,6× dan menurunkan p99 latency ±87%; compound index menghilangkan full collection scan dan in-memory sort.

### Detail implementasi

- Cache-aside: [backend/src/cache/cache.service.ts](backend/src/cache/cache.service.ts) + [backend/src/products/products.service.ts](backend/src/products/products.service.ts) (TTL 60s, invalidasi saat create/update/delete)
- Index: [backend/src/products/schemas/product.schema.ts](backend/src/products/schemas/product.schema.ts) — compound `{category, createdAt}`, `price`, text index `name`
- Script evaluasi: [backend/scripts/benchmark.js](backend/scripts/benchmark.js), [backend/scripts/explain-queries.js](backend/scripts/explain-queries.js)

## Penyimpanan Data Skalabel (Poliglot Persistence, Replikasi & Partisi)

Project ini juga merupakan prototipe sistem penyimpanan data skalabel:

- **Poliglot persistence** — tiga teknologi penyimpanan sesuai karakteristik data: MongoDB (dokumen fleksibel), Redis (akses cepat in-memory), MinIO (objek biner/gambar).
- **Replikasi** — MongoDB replica set `rs0` dengan 3 node (1 PRIMARY + 2 SECONDARY) untuk high availability dan failover otomatis; write ke primary tereplikasi ke secondary (terukur ±20 ms).
- **Partisi (sharding)** — analisis strategi shard key terhadap data nyata; rekomendasi compound key `{ tenantId: 1, _id: 'hashed' }` (ketimpangan distribusi hanya 4,6%) agar merata sekaligus query per-tenant tetap targeted.
- **Adaptif** — cache Redis menyerap lonjakan beban baca dan terdegradasi mulus saat cache mati; API stateless siap di-scale horizontal.

### Menjalankan demo skalabilitas

```bash
cd backend

# Status replica set + bukti replikasi write-primary/read-secondary
npm run replication

# Analisis distribusi 4 kandidat shard key pada data products nyata
npm run partition
```

Contoh output `npm run replication`:

```
=== Replica Set "rs0" ===
  host.docker.internal:27017     PRIMARY health=1
  host.docker.internal:27018     SECONDARY (lag: 0s) health=1
  host.docker.internal:27019     SECONDARY (lag: 0s) health=1

Write ke PRIMARY   : repl-test-...
Read dari SECONDARY: repl-test-... (tereplikasi dalam 20 ms)
products di PRIMARY  : 1098 dokumen
products di SECONDARY: 1098 dokumen
=> Konsisten ✔
```

Hasil analisis shard key (1.098 dokumen, 3 shard simulasi):

| Shard key                     | Ketimpangan | Catatan                                     |
| ----------------------------- | ----------- | ------------------------------------------- |
| Range-based `category`        | 29,9%       | Rawan hotspot kategori dominan              |
| Hashed `tenantId`             | 141,4%      | Timpang saat tenant masih sedikit           |
| **Compound `tenantId + _id`** | **4,6%**    | **Merata + query per-tenant targeted** ✔    |
| Hashed `_id`                  | 4,7%        | Merata tapi query per-tenant scatter-gather |

## Testing

```bash
cd backend
npm test
```

## Struktur Project

```
├── docker-compose.yml      # MongoDB replica set (3 node), Redis, MinIO
├── backend/
│   ├── scripts/            # benchmark, explain-queries, replication-status, partition-demo
│   └── src/
│       ├── ai/             # Chat & pencarian AI (Ollama)
│       ├── auth/           # JWT auth (register/login)
│       ├── cache/          # Redis cache-aside service
│       ├── health/         # Health check
│       ├── products/       # CRUD produk + query katalog
│       ├── seed/           # Seed admin & data contoh
│       └── storage/        # Upload gambar ke MinIO
└── frontend/
    └── src/
        ├── app/            # Pages (katalog, admin, dashboard, auth)
        ├── components/     # UI components (chat widget, navbar, dll.)
        └── lib/            # API client & auth context
```
