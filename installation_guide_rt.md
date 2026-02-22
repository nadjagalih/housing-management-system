# 📦 Panduan Instalasi Lengkap — Sistem Manajemen RT

Panduan ini mencakup seluruh langkah yang diperlukan untuk menginstal dan menjalankan aplikasi **Sistem Manajemen RT**, baik sisi backend (Laravel) maupun frontend (React).

---

## ⚙️ Tech Stack

- **Backend**: Laravel 10, PHP 8.1+, MySQL 8.0
- **Frontend**: React 19, Vite, Tailwind CSS
- **Authentication**: Laravel Sanctum (Token-based)

---

## ✅ Requirement

Pastikan semua komponen berikut sudah terinstal di sistem Anda sebelum melanjutkan.

| Komponen | Versi Minimum | Perintah Cek Versi |
|---|---|---|
| PHP | 8.1 | `php -v` |
| Composer | 2.x | `composer -v` |
| Node.js | 18.x | `node -v` |
| NPM | 9.x | `npm -v` |
| MySQL | 8.0 | `mysql --version` |
| Git | 2.x | `git --version` |

**Ekstensi PHP yang wajib aktif:** `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `tokenizer`, `xml`.

---

## 🚀 Proses Instalasi

Proses instalasi dibagi menjadi dua bagian utama: Backend dan Frontend.

### 1. Clone Repository

Langkah pertama adalah mengunduh source code dari repository.

```bash
git clone https://github.com/nadjagalih/housing-management-system.git
cd housing-management-system
```

### 2. Setup Backend (Laravel)

Semua perintah berikut dijalankan dari dalam folder `backend-manajemen-rt`.

```bash
cd backend-manajemen-rt
```

#### a. Install Dependencies

```bash
composer install
```

#### b. Konfigurasi Environment

Salin file `.env.example` menjadi `.env` dan konfigurasikan koneksi database Anda.

```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan bagian berikut:

```env
APP_NAME="RT Management"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rt_management
DB_USERNAME=root
DB_PASSWORD=your_password
```

#### c. Buat Database

Masuk ke MySQL dan buat database dengan nama yang sesuai dengan konfigurasi di `.env`.

```sql
CREATE DATABASE rt_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### d. Generate Application Key

```bash
php artisan key:generate
```

#### e. Jalankan Migrasi & Seeder

Perintah ini akan membuat struktur tabel dan mengisi data awal (akun admin, data rumah, penghuni, iuran, dll).

```bash
php artisan migrate --seed
```

#### f. Buat Symbolic Link Storage

Ini penting agar file yang di-upload (seperti foto KTP) dapat diakses oleh publik.

```bash
php artisan storage:link
```

#### g. Jalankan Server Backend

```bash
php artisan serve
```

Server backend akan berjalan di **http://localhost:8000**. Biarkan terminal ini tetap berjalan.

---

### 3. Setup Frontend (React)

Buka **terminal baru** dan jalankan semua perintah berikut dari dalam folder `frontend-manajemen-rt`.

```bash
cd frontend-manajemen-rt
```

#### a. Install Dependencies

```bash
npm install
```

#### b. Konfigurasi Environment

Salin file `.env.example` dan pastikan URL API menunjuk ke backend yang sedang berjalan.

```bash
cp .env.example .env
```

Isi file `.env`:

```env
VITE_API_URL=http://localhost:8000
```

#### c. Jalankan Development Server

```bash
npm run dev
```

Aplikasi frontend akan berjalan di **http://localhost:5173**.

---

## 🔑 Akun Default

Setelah proses seeder di backend berhasil, Anda bisa login menggunakan akun berikut:

| Field | Value |
|---|---|
| Email | `admin@rt.com` |
| Password | `password` |

> ⚠️ Segera ganti password setelah berhasil login untuk pertama kali.

---

## 🛠️ Troubleshooting

#### ❌ Error CORS di Frontend

Ini terjadi jika frontend tidak diizinkan mengakses backend.
1.  Pastikan `APP_URL` di `.env` backend adalah `http://localhost:8000`.
2.  Pastikan `VITE_API_URL` di `.env` frontend adalah `http://localhost:8000`.
3.  Jika masih gagal, buka `backend-manajemen-rt/config/cors.php`, pastikan `allowed_origins` berisi URL frontend.
    ```php
    'allowed_origins' => ['http://localhost:5173'],
    ```
4.  Jalankan `php artisan optimize:clear` di direktori backend.

#### ❌ Foto KTP Tidak Muncul

1.  Pastikan Anda sudah menjalankan `php artisan storage:link` di direktori backend.
2.  Verifikasi bahwa folder `backend-manajemen-rt/public/storage` telah dibuat dan merupakan symlink ke `backend-manajemen-rt/storage/app/public`.

#### ❌ `composer install` atau `npm install` Gagal

1.  Pastikan versi PHP, Node.js, dan Composer Anda sesuai dengan tabel **Requirement**.
2.  Untuk `composer`, pastikan semua ekstensi PHP yang dibutuhkan sudah aktif.
3.  Untuk `npm`, coba hapus folder `node_modules` dan file `package-lock.json`, lalu jalankan `npm install` lagi.

#### ❌ `php artisan migrate` Gagal

1.  Pastikan kredensial database (DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD) di file `.env` backend sudah benar.
2.  Pastikan database `rt_management` sudah Anda buat di MySQL.

---

## ✨ Perintah Berguna

#### Backend (`backend-manajemen-rt`)

```bash
# Reset database dan jalankan ulang semua seeder
php artisan migrate:fresh --seed

# Membersihkan semua cache (config, route, view)
php artisan optimize:clear

# Melihat daftar semua endpoint API yang terdaftar
php artisan route:list --path=api
```

#### Frontend (`frontend-manajemen-rt`)

```bash
# Menjalankan ESlint untuk memeriksa kualitas kode
npm run lint

# Membuat build aplikasi untuk production
npm run build

# Menjalankan preview dari hasil build production
npm run preview
```
