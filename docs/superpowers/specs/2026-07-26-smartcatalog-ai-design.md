# SmartCatalog AI — Design Spec

**Tanggal:** 2026-07-26
**Status:** Disetujui user (brainstorming selesai)
**Sumber:** PRD SmartCatalog AI v1.1.0 + requirement Tugas kuliah

## 1. Kesesuaian dengan Tugas

| Requirement Tugas                                 | Implementasi                                                | Status |
| ------------------------------------------------- | ----------------------------------------------------------- | ------ |
| Database → MongoDB                                | MongoDB (koleksi users, products, chat_logs)                | ✅     |
| RESTful API → Swagger (Express/NestJS)            | NestJS + @nestjs/swagger, Swagger UI di `/api/docs`         | ✅     |
| Web FE (ReactJS/NextJS)                           | Next.js (App Router) + Tailwind CSS                         | ✅     |
| Gambar disimpan pada MinIO                        | Upload multipart → MinIO, simpan `imageUrl`                 | ✅     |
| AI → https://ollama.if.unismuh.ac.id/api/generate | Dipanggil backend, model default `gemma3:4b` via `.env`     | ✅     |
| Docker                                            | Docker Compose 4 service, satu perintah `docker compose up` | ✅     |

## 2. Keputusan Desain

- **Backend:** NestJS (bukan Express) — Swagger auto-generate dari decorator DTO.
- **Scope AI:** Modul 2 (Contextual Product Chat) DAN Modul 3 (Global Smart Advisory Search).
- **Auth:** Lengkap multi-user — register + login JWT, role `admin` dan `buyer`.
- **Seed data:** Otomatis saat startup — 10–15 produk elektronik + 1 akun admin default.
- **Model Ollama:** `gemma3:4b` (configurable via `OLLAMA_MODEL` di `.env`).
- **Struktur:** Monorepo, 4 container (Opsi A).
- **Hardening (review lanjutan 2026-07-27):** MinIO public URL rewrite, healthcheck + startup ordering, CORS, rate limiting endpoint AI, pagination produk, prompt guardrail. Ditolak (YAGNI): streaming SSE, refresh token, Redis/queue/vector search.

## 3. Arsitektur

```
smartcatalog-ai/
├── docker-compose.yml        # mongodb, minio, api, web
├── backend/                  # NestJS
│   └── src/
│       ├── auth/             # register, login, JWT, role guard
│       ├── products/         # CRUD + upload gambar ke MinIO
│       ├── ai/               # chat kontekstual + global smart search
│       ├── storage/          # MinIO client service
│       └── seed/             # seed produk + akun admin
└── frontend/                 # Next.js App Router
    └── src/app/
        ├── page.tsx          # katalog grid + Global AI Search bar
        ├── products/[id]/    # detail produk + widget chat AI
        ├── login/ register/
        └── admin/            # dashboard CRUD produk (admin only)
```

**Container:**
| Service | Image/Build | Port | Volume |
|---|---|---|---|
| mongodb | mongo | 27017 | ya |
| minio | minio/minio | 9000 (API), 9001 (console) | ya |
| api | build ./backend | 3001 | - |
| web | build ./frontend | 3000 | - |

Ollama TIDAK di-container — backend memanggil server kampus `https://ollama.if.unismuh.ac.id/api/generate` (URL + model di `.env`).

**Startup & ordering:**

- `mongodb` dan `minio` punya Docker `healthcheck`; `api` pakai `depends_on: condition: service_healthy` agar seed tidak jalan sebelum DB/storage siap.
- Saat bootstrap, `storage/` service otomatis membuat bucket `products` (jika belum ada) dan set policy public-read.
- `api` expose `GET /api/v1/health` (status app + koneksi Mongo) untuk healthcheck container `api`.
- CORS di-enable di NestJS untuk origin FE (`CORS_ORIGIN=http://localhost:3000`).

**MinIO public URL:** objek disimpan via hostname internal `minio:9000`, tetapi `imageUrl` yang disimpan/dikembalikan memakai `MINIO_PUBLIC_URL` (default `http://localhost:9000`) agar bisa diakses browser.

**Alur AI kontekstual (Modul 2):**
widget chat → `POST /api/v1/products/:id/chat` → backend ambil produk dari MongoDB → susun prompt (specs JSON + pertanyaan) → Ollama `/api/generate` → jawaban ke widget → log ke `chat_logs`.

**Alur Global Search (Modul 3):**
search bar → `POST /api/v1/ai/search` → backend filter kandidat produk (kategori/harga/regex) → ringkasan kandidat + query dikirim ke Ollama → AI merekomendasikan produk + alasan → FE menampilkan teks + kartu produk.

## 4. Data Model (MongoDB)

- `users` — `{ name, email (unique), passwordHash (bcrypt), role: 'admin'|'buyer', createdAt }`
- `products` — `{ name, category, price, imageUrl, specs: object (JSON bebas), tenantId: 'default', createdAt }`
- `chat_logs` — `{ productId?, question, reply, createdAt }`

`tenantId` disiapkan untuk skalabilitas multi-tenant (NFR PRD), nilai tetap `'default'` di MVP.

## 5. API Endpoints

Semua endpoint terdokumentasi di Swagger `/api/docs`: summary, description, DTO request body, response codes (200/201/400/401/403/404/500). Swagger memiliki tombol Authorize (Bearer JWT).

| Method | Endpoint                    | Akses  | Keterangan                           |
| ------ | --------------------------- | ------ | ------------------------------------ |
| POST   | `/api/v1/auth/register`     | publik | role default buyer                   |
| POST   | `/api/v1/auth/login`        | publik | return JWT                           |
| GET    | `/api/v1/health`            | publik | status app + koneksi MongoDB         |
| GET    | `/api/v1/products`          | publik | filter: category, minPrice, maxPrice; pagination: page (default 1), limit (default 12, max 50); response menyertakan meta `{ total, page, limit }` |
| GET    | `/api/v1/products/:id`      | publik | 404 jika tidak ada                   |
| POST   | `/api/v1/products`          | admin  | multipart/form-data, image → MinIO   |
| PATCH  | `/api/v1/products/:id`      | admin  | update data / ganti gambar           |
| DELETE | `/api/v1/products/:id`      | admin  | hapus produk + objek MinIO           |
| POST   | `/api/v1/products/:id/chat` | publik | body: `{ message }`                  |
| POST   | `/api/v1/ai/search`         | publik | body: `{ query }`                    |

## 6. Error Handling & Validasi

- Upload: hanya `image/png` / `image/jpeg`, max 5MB → 400 jika melanggar.
- DTO validation via `class-validator` → 400 dengan detail field.
- Ollama unreachable/timeout (30 detik) → 500 `{ "message": "Ollama API error or unreachable" }`.
- Produk tidak ditemukan → 404 `{ "message": "Product not found" }`.
- Endpoint admin tanpa token → 401; token valid tapi bukan admin → 403.
- Rate limiting endpoint AI (`/products/:id/chat` dan `/ai/search`): 5 request/menit/IP via `@nestjs/throttler` → 429 `{ "message": "Too many requests, coba lagi sebentar" }`.

**Prompt guardrail (AI):** prompt template menginstruksikan model hanya menjawab berdasarkan data produk yang disuntikkan, dalam Bahasa Indonesia, dan menolak sopan pertanyaan di luar konteks produk (jawaban fallback: arahkan user bertanya seputar produk). Berlaku untuk Modul 2 dan Modul 3.

## 7. Frontend & UX

- **Home:** grid card produk responsif, filter kategori & harga, kontrol pagination (page/limit), Global AI Search bar dengan hasil rekomendasi AI + kartu produk.
- **Detail produk:** foto, tabel spesifikasi dari JSON, widget chat AI floating dengan riwayat sesi & loading indicator.
- **Login/Register:** JWT disimpan di localStorage, auth context global.
- **Admin dashboard:** tabel produk, form tambah/edit (JSON editor sederhana untuk specs, upload gambar dengan preview), hapus dengan konfirmasi. Diproteksi role admin.
- FE memanggil API via `NEXT_PUBLIC_API_URL` dengan Bearer token interceptor.

## 8. Testing

- Unit test: service `ai` (prompt building) dan `products` (filter) — Jest.
- E2E test: endpoint utama (auth, products CRUD, chat) — Jest + Supertest.
- Verifikasi manual via Swagger UI.
- Smoke test: `docker compose up` → seed jalan → katalog tampil → chat AI menjawab.

## 9. Environment Variables

```
MONGODB_URI=mongodb://mongodb:27017/smartcatalog
MINIO_ENDPOINT=minio
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=products
OLLAMA_URL=https://ollama.if.unismuh.ac.id/api/generate
OLLAMA_MODEL=gemma3:4b
JWT_SECRET=...
ADMIN_EMAIL=admin@smartcatalog.test
ADMIN_PASSWORD=...
MINIO_PUBLIC_URL=http://localhost:9000
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 10. Out of Scope (Roadmap PRD Phase 2–3)

Multi-tenant aktif, payment gateway, dashboard analitik, embeddable widget.js, API key management.

Ditolak untuk MVP (YAGNI): streaming SSE jawaban AI, refresh token / logout server-side, Redis cache, message queue, embedding/vector search.
