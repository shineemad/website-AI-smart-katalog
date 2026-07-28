# SmartCatalog AI — Implementation Plan

**Tanggal:** 2026-07-28
**Spec:** `docs/superpowers/specs/2026-07-26-smartcatalog-ai-design.md`
**Aturan main:** kerjakan fase berurutan; setiap fase diakhiri verifikasi + commit git. Jangan lanjut fase berikutnya sebelum verifikasi lulus.

## Fase 0 — Scaffold & Infrastruktur

1. Buat struktur monorepo: `backend/` (NestJS via `nest new`), `frontend/` (Next.js via `create-next-app` + Tailwind).
2. Buat `docker-compose.yml`: service `mongodb` (volume, healthcheck `mongosh --eval "db.adminCommand('ping')"`), `minio` (volume, console :9001, healthcheck `mc ready local` / curl `/minio/health/live`), `api` (build ./backend, :3001, `depends_on: service_healthy`), `web` (build ./frontend, :3000).
3. Buat `.env.example` berisi semua variabel dari spec §9; `.env` masuk `.gitignore`.
4. Dockerfile multi-stage untuk backend & frontend.

**Verifikasi:** `docker compose up` → 4 container hidup; mongo & minio healthy; NestJS default app merespons di :3001; Next.js default page di :3000.

## Fase 1 — Backend Core: Config, Health, Mongo

1. Setup `@nestjs/config` (load env), `@nestjs/mongoose` (koneksi `MONGODB_URI`).
2. Global prefix `api/v1`, enable CORS dari `CORS_ORIGIN`, global `ValidationPipe` (whitelist, transform).
3. Endpoint `GET /api/v1/health` → `{ status: 'ok', mongo: 'connected' }`.
4. Setup Swagger di `/api/docs` (DocumentBuilder sesuai contoh PRD §8.3, `addBearerAuth()`).

**Verifikasi:** `/api/v1/health` 200; `/api/docs` tampil.

## Fase 2 — Auth (register, login, JWT, roles)

1. Schema `User` (name, email unique, passwordHash bcrypt, role enum admin|buyer, createdAt).
2. `POST /auth/register` (DTO: name, email, password min 6; role paksa `buyer`) → 201; email duplikat → 400.
3. `POST /auth/login` → `{ accessToken }` (JWT payload: sub, email, role; expiry 1 hari); kredensial salah → 401.
4. `JwtAuthGuard` + `RolesGuard` + decorator `@Roles('admin')`.
5. Decorator Swagger lengkap (summary, DTO, response codes) di semua endpoint.
6. Unit/e2e test: register, login, guard menolak non-admin.

**Verifikasi:** `npm test` hijau; coba via Swagger Authorize.

## Fase 3 — Storage (MinIO) & Products CRUD

1. `StorageService`: init MinIO client; `onModuleInit` buat bucket `products` bila belum ada + set policy public-read; method `upload(file)` → return URL memakai `MINIO_PUBLIC_URL`; method `delete(objectName)`.
2. Schema `Product` (name, category, price, imageUrl, specs object, tenantId default 'default', createdAt).
3. Endpoint:
   - `GET /products` — filter category/minPrice/maxPrice, pagination page/limit (default 1/12, max 50), response `{ data, meta: { total, page, limit } }`.
   - `GET /products/:id` — 404 bila tidak ada.
   - `POST /products` (admin, multipart) — validasi image png/jpeg max 5MB (`FileInterceptor` + custom validator) → upload MinIO → simpan Mongo → 201.
   - `PATCH /products/:id` (admin) — update field / ganti gambar (hapus objek lama).
   - `DELETE /products/:id` (admin) — hapus dokumen + objek MinIO.
4. Swagger: `@ApiConsumes('multipart/form-data')` + DTO schema.
5. Test: filter & pagination service, e2e CRUD dengan mock/real MinIO.

**Verifikasi:** upload produk lewat Swagger; buka `imageUrl` di browser (harus tampil via localhost:9000).

## Fase 4 — AI Module (Ollama)

1. `OllamaClient`: POST ke `OLLAMA_URL` body `{ model: OLLAMA_MODEL, prompt, stream: false }`, timeout 30 detik; error/timeout → lempar `ServiceUnavailable`/500 `{ message: "Ollama API error or unreachable" }`.
2. Prompt guardrail template (Bahasa Indonesia, hanya jawab dari data produk, fallback sopan di luar konteks).
3. `POST /products/:id/chat` — ambil produk (404 bila tidak ada) → prompt = guardrail + specs JSON + pertanyaan → Ollama → simpan `chat_logs` → response `{ success, productId, reply }`.
4. `POST /ai/search` — DTO `{ query }`; filter kandidat produk (regex nama/kategori + parsing harga sederhana bila ada, ambil max 10) → ringkas kandidat → prompt rekomendasi → response `{ success, reply, products: [kandidat] }`; simpan log.
5. Rate limiting: `@nestjs/throttler` 5 req/menit/IP hanya pada kedua endpoint AI → 429.
6. Unit test prompt builder (guardrail + injeksi konteks) dengan OllamaClient di-mock.

**Verifikasi:** tanya via Swagger ke produk seed → jawaban relevan; verifikasi model tersedia (cek `GET /api/tags` server kampus, sesuaikan `OLLAMA_MODEL` bila `gemma3:4b` tidak ada).

## Fase 5 — Seed

1. `SeedService` jalan saat bootstrap: bila `users` kosong → buat admin dari `ADMIN_EMAIL`/`ADMIN_PASSWORD`; bila `products` kosong → insert 12 produk elektronik (laptop/HP/aksesoris, specs JSON realistis, gambar placeholder di-upload ke MinIO dari `backend/seed-assets/`).
2. Idempotent: tidak duplikat saat restart.

**Verifikasi:** `docker compose down -v && docker compose up` → katalog terisi otomatis, login admin berhasil.

## Fase 6 — Frontend

1. Setup: Tailwind, `NEXT_PUBLIC_API_URL`, API client (fetch wrapper + Bearer dari localStorage), AuthContext (login/logout/role).
2. **Home** (`/`): grid card produk (foto, nama, kategori, harga rupiah), filter kategori & rentang harga, pagination, Global AI Search bar → panel hasil rekomendasi (teks AI + kartu produk).
3. **Detail** (`/products/[id]`): foto besar, tabel specs dari JSON, widget chat AI floating (riwayat sesi di state, loading indicator, error toast bila 500/429).
4. **Login/Register** (`/login`, `/register`): form + validasi, redirect setelah sukses.
5. **Admin** (`/admin`): guard role admin (redirect bila bukan); tabel produk; form create/edit (input specs JSON dengan validasi parse + preview gambar); delete dengan confirm.
6. Responsif mobile (grid 1-2-4 kolom).

**Verifikasi:** alur lengkap di browser: register → login → browse → filter → chat AI → admin CRUD.

## Fase 7 — Integrasi Akhir & Dokumentasi

1. Pastikan `docker compose up` dari clean state menjalankan semuanya (smoke test spec §8).
2. `README.md`: deskripsi, arsitektur, cara jalan (`docker compose up`), URL penting (:3000, :3001/api/docs, :9001), akun admin default, daftar env.
3. Review Swagger: semua endpoint punya summary, description, DTO, response codes.
4. Jalankan seluruh test suite.

**Verifikasi:** checklist Tugas 6/6 terdemonstrasi; commit final.

## Urutan Commit (ringkas)

scaffold → compose+env → health+swagger → auth → storage+products → ai+throttle → seed → fe-setup → fe-home → fe-detail+chat → fe-auth → fe-admin → readme+polish

## Catatan Risiko

- Server Ollama kampus down saat demo → tunjukkan error handling yang rapi + screenshot jawaban sukses sebagai cadangan.
- Nama model belum pasti → verifikasi `GET https://ollama.if.unismuh.ac.id/api/tags` di awal Fase 4.
