# 🔍 Analisis Proyek: Housing Management System (Manajemen RT)

Dokumen ini merangkum hasil analisis kekurangan dan kesalahan yang ditemukan pada proyek `housing-management-system`.

---

## 🔴 Kesalahan (Bugs & Masalah Kritis)

### 1. Inkonsistensi `house_type` — Enum Berbeda antara Migration, Seeder, dan Request

Di **migration** dan **seeder**, nilai `house_type` menggunakan `'tetap'` dan `'kontrak'`, tetapi di **API documentation** menggunakan `'permanent'` dan `'flexible'`.

```
?type=permanent|flexible  ← di api_endpoints_rt.md
'house_type' => 'in:tetap,kontrak'  ← di StoreHouseRequest
```

> ⚠️ **Dampak**: Filter berdasarkan `?type=` di frontend tidak akan berfungsi karena value yang dikirim tidak cocok dengan data di database.

---

### 2. `resident_type` Juga Inkonsisten

Di seeder menggunakan `'tetap'` dan `'kontrak'`, tapi API docs menyebutkan `'permanent'` dan `'contract'`. Query filter di `ResidentController` menggunakan value yang dikirim frontend langsung ke database tanpa konversi.

> ⚠️ **Dampak**: Frontend yang mengirim `?type=permanent` tidak akan dapat data, karena database menyimpan `'tetap'`.

---

### 3. Migration `users` Tidak Menyertakan Kolom `role`

Kolom `role` tidak ada di migration awal `create_users_table.php`. Kolom ini baru ditambahkan di migration terpisah `2026_02_20_000007_add_role_to_users_table.php`.

> ⚠️ **Dampak**: Berpotensi gagal jika migration dijalankan tidak berurutan atau ada rollback parsial. Lebih baik kolom `role` langsung ada di migration awal.

---

### 4. `ExpenseController::update()` Tidak Menggunakan FormRequest

Method `update()` menggunakan `$request->validate([...])` langsung di dalam controller, sementara method `store()` sudah menggunakan `StoreExpenseRequest`.

> ⚠️ Inkonsistensi dan melanggar prinsip Single Responsibility. Seharusnya ada `UpdateExpenseRequest` tersendiri.

---

### 5. `PaymentTypeController::update()` Juga Tidak Menggunakan FormRequest

Sama seperti `ExpenseController`, method `update()` di `PaymentTypeController` juga melakukan validasi langsung di controller tanpa FormRequest.

---

### 6. `index.html` Masih Menggunakan Title Default Vite

```html
<!-- Sekarang (salah): -->
<title>frontend-manajemen-rt</title>

<!-- Seharusnya: -->
<title>Sistem Manajemen RT</title>
```

---

### 7. `App.css` Berisi Style Default Vite yang Tidak Relevan

File `App.css` tidak dibersihkan dari template default Vite (berisi `.logo`, `logo-spin` animation, dll). Ini adalah sisa boilerplate yang tidak digunakan dan bisa menyebabkan konflik style.

---

## 🟡 Kekurangan (Missing Features & Best Practices)

### 8. Tidak Ada File `.env.example` di Repository

File `.env.example` tidak di-commit ke repo, padahal dokumentasi menyuruh `cp .env.example .env`.

> Ini membuat developer baru tidak bisa langsung setup tanpa panduan manual yang lebih detail.

---

### 9. CORS `allowed_origins` Hardcoded ke `localhost`

```php
// config/cors.php (sekarang — bermasalah di production):
'allowed_origins' => ['http://localhost:5173'],

// Seharusnya menggunakan environment variable:
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
```

> Di environment production, nilai ini harus diganti. Hardcode localhost ke konfigurasi berbahaya jika lupa diganti.

---

### 10. Tidak Ada Unit Test / Feature Test

PHPUnit sudah ada sebagai dependency di `composer.json`, tetapi tidak ada file test yang ditulis. Endpoint-endpoint kritis seperti login, generate pembayaran bulanan, dan laporan tidak memiliki coverage test sama sekali.

---

### 11. Password Default Sangat Lemah di Seeder

```php
// database/seeders/UserSeeder.php
'password' => Hash::make('password'),  // ❌ terlalu lemah
```

> Sebaiknya gunakan password yang lebih aman atau baca dari environment variable:
> `Hash::make(env('ADMIN_DEFAULT_PASSWORD', 'ChangeMe123!'))`

---

### 12. Tidak Ada Rate Limiting Spesifik untuk Endpoint Login

Rate limit global 60 request/menit diterapkan untuk semua API. Endpoint `/auth/login` seharusnya punya rate limit **lebih ketat** (misalnya 5/menit per IP) untuk mencegah serangan brute force.

```php
// Contoh perbaikan di RouteServiceProvider:
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});
```

---

### 13. Tidak Ada Soft Delete pada Model `Expense` dan `Payment`

Model `Resident` menggunakan soft delete (`deleted_at`), tetapi `Expense` dan `Payment` tidak. Jika data dihapus secara permanen, laporan historis akan terpengaruh dan data tidak bisa di-recover.

---

### 14. README Utama Memiliki Ketidaksesuaian Nama Folder

```
# README.md (salah):
rt-management/
├── backend/     ← nama folder salah
├── frontend/    ← nama folder salah

# Folder aktual:
rt-management/
├── backend-manajemen-rt/
├── frontend-manajemen-rt/
```

> Ketidaksesuaian ini menyesatkan pengguna/developer baru yang membaca README.

---

### 15. `PublicResidentController` Mengekspos Data Sensitif Tanpa Autentikasi

Endpoint publik `/api/v1/public/residents` mengekspos data seperti `phone_number` dan `marital_status` warga **tanpa autentikasi apapun**.

> Data pribadi warga seperti nomor telepon dan status pernikahan sebaiknya **tidak diekspos secara publik**. Pertimbangkan untuk menambahkan minimal satu lapisan autentikasi atau membatasi field yang ditampilkan.

---

## 📋 Ringkasan

| No | Kategori | Masalah | Prioritas |
|----|----------|---------|-----------|
| 1 | 🔴 Bug | Inkonsistensi nilai enum `house_type` | Tinggi |
| 2 | 🔴 Bug | Inkonsistensi nilai enum `resident_type` | Tinggi |
| 3 | 🔴 Bug | Kolom `role` tidak ada di migration awal `users` | Tinggi |
| 4 | 🔴 Bug | `ExpenseController::update()` tidak pakai FormRequest | Sedang |
| 5 | 🔴 Bug | `PaymentTypeController::update()` tidak pakai FormRequest | Sedang |
| 6 | 🔴 Bug | `index.html` masih pakai title default Vite | Rendah |
| 7 | 🔴 Bug | `App.css` berisi boilerplate Vite yang tidak relevan | Rendah |
| 8 | 🟡 Kurang | Tidak ada file `.env.example` di repo | Tinggi |
| 9 | 🟡 Kurang | CORS origin hardcoded ke localhost | Tinggi |
| 10 | 🟡 Kurang | Tidak ada unit/feature test | Sedang |
| 11 | 🟡 Kurang | Password default terlalu lemah di seeder | Sedang |
| 12 | 🟡 Kurang | Tidak ada rate limiting khusus untuk endpoint login | Sedang |
| 13 | 🟡 Kurang | Tidak ada soft delete pada `Expense` dan `Payment` | Sedang |
| 14 | 🟡 Kurang | Nama folder di README tidak sesuai struktur aktual | Rendah |
| 15 | 🟡 Kurang | Data sensitif warga diekspos tanpa autentikasi | Tinggi |

---

## ✅ Rekomendasi Perbaikan (Urutan Prioritas)

1. **[Tinggi]** Fix inkonsistensi nilai enum `house_type` dan `resident_type` agar seragam antara database, backend, dan frontend
2. **[Tinggi]** Tambahkan file `.env.example` untuk backend dan frontend ke repository
3. **[Tinggi]** Gunakan environment variable untuk CORS `allowed_origins`
4. **[Tinggi]** Batasi atau amankan endpoint publik yang mengekspos data pribadi warga
5. **[Sedang]** Tambahkan rate limiting khusus untuk endpoint `/auth/login`
6. **[Sedang]** Buat `UpdateExpenseRequest` dan `UpdatePaymentTypeRequest` agar konsisten
7. **[Sedang]** Tambahkan soft delete pada model `Expense` dan `Payment`
8. **[Sedang]** Tulis minimal beberapa feature test untuk endpoint kritis
9. **[Rendah]** Perbaiki `index.html` title dan bersihkan `App.css` dari boilerplate Vite
10. **[Rendah]** Perbaiki nama folder di README utama agar sesuai struktur aktual

---

*Dokumen ini dibuat secara otomatis berdasarkan analisis kode pada repository `nadjagalih/housing-management-system`.