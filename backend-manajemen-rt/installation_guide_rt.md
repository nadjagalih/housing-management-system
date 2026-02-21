# 📦 Panduan Instalasi — Sistem Manajemen RT

> Pastikan seluruh requirement terpenuhi sebelum memulai proses instalasi.

---

## Requirement

| Komponen | Versi Minimum |
|---|---|
| PHP | 8.2 |
| Composer | 2.x |
| Node.js | 18.x |
| NPM | 9.x |
| MySQL | 8.0 |
| Git | 2.x |

---

## Struktur Repo

```
rt-management/
├── rt-management-backend/    # Laravel
└── rt-management-frontend/   # React + Vite
```

---

## 1. Clone Repository

```bash
git clone https://github.com/username/rt-management.git
cd rt-management
```

---

## 2. Setup Backend (Laravel)

### 2.1 Masuk ke folder backend

```bash
cd rt-management-backend
```

### 2.2 Install dependencies

```bash
composer install
```

### 2.3 Salin file environment

```bash
cp .env.example .env
```

### 2.4 Konfigurasi file `.env`

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

FILESYSTEM_DISK=public
```

> ⚠️ Pastikan database `rt_management` sudah dibuat di MySQL sebelum langkah berikutnya.

### 2.5 Buat database

Masuk ke MySQL dan jalankan:

```sql
CREATE DATABASE rt_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.6 Generate application key

```bash
php artisan key:generate
```

### 2.7 Jalankan migrasi dan seeder

```bash
php artisan migrate --seed
```

Seeder akan membuat data awal berikut:
- 1 akun admin RT
- 20 data rumah (15 permanent, 5 flexible)
- 2 jenis iuran (satpam & kebersihan)
- Beberapa data penghuni contoh

### 2.8 Buat symbolic link storage

```bash
php artisan storage:link
```

> Perintah ini diperlukan agar foto KTP yang diupload bisa diakses via URL publik.

### 2.9 Jalankan server backend

```bash
php artisan serve
```

Backend berjalan di: **http://localhost:8000**

---

## 3. Setup Frontend (React)

Buka terminal baru, lalu:

### 3.1 Masuk ke folder frontend

```bash
cd rt-management-frontend
```

### 3.2 Install dependencies

```bash
npm install
```

### 3.3 Salin file environment

```bash
cp .env.example .env
```

### 3.4 Konfigurasi file `.env`

```env
VITE_API_URL=http://localhost:8000
```

### 3.5 Jalankan development server

```bash
npm run dev
```

Frontend berjalan di: **http://localhost:5173**

---

## 4. Akun Default

Setelah seeder berhasil dijalankan, gunakan akun berikut untuk login:

| Field | Value |
|---|---|
| Email | `admin@rt.com` |
| Password | `password` |

> ⚠️ Segera ganti password setelah login pertama.

---

## 5. Verifikasi Instalasi

Pastikan semua komponen berikut berjalan dengan benar:

- [ ] Backend merespons di `http://localhost:8000`
- [ ] Frontend tampil di `http://localhost:5173`
- [ ] Login berhasil dengan akun default
- [ ] Dashboard menampilkan data awal (20 rumah, 2 jenis iuran)
- [ ] Upload foto KTP berhasil dan file tersimpan di `storage/app/public/ktp/`

---

## 6. Troubleshooting

### ❌ `php artisan migrate` gagal
Pastikan kredensial database di `.env` sudah benar dan database `rt_management` sudah dibuat.

### ❌ Foto KTP tidak bisa diakses
Jalankan ulang perintah berikut:
```bash
php artisan storage:link
```
Pastikan folder `public/storage` sudah terbentuk dan mengarah ke `storage/app/public`.

### ❌ CORS error di frontend
Pastikan nilai `APP_URL` di `.env` backend sudah benar. Jika masih error, cek file `config/cors.php` dan pastikan `allowed_origins` mencakup `http://localhost:5173`:
```php
'allowed_origins' => ['http://localhost:5173'],
```
Lalu jalankan:
```bash
php artisan config:clear
```

### ❌ `npm install` gagal
Pastikan versi Node.js minimal 18.x. Cek dengan:
```bash
node -v
```

### ❌ `composer install` gagal
Pastikan versi PHP minimal 8.2. Cek dengan:
```bash
php -v
```
Pastikan ekstensi PHP berikut aktif: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `tokenizer`, `xml`.

---

## 7. Perintah Berguna

```bash
# Reset database dan jalankan ulang seeder
php artisan migrate:fresh --seed

# Clear semua cache Laravel
php artisan optimize:clear

# Cek semua route yang terdaftar
php artisan route:list
```

---

*Jika mengalami kendala instalasi yang tidak tercakup di atas, hubungi pengembang melalui informasi yang tertera di repo.*
