# Sistem Manajemen RT — Backend

REST API backend untuk sistem manajemen administrasi RT (Rukun Tetangga), melayani pengelolaan penghuni, rumah, pembayaran iuran, pengeluaran, dan pelaporan keuangan.

Dibangun dengan **Laravel 10 + Laravel Sanctum** dan database **MySQL**.

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| PHP | 8.1+ | Runtime |
| Laravel | 10.x | Framework utama |
| Laravel Sanctum | 3.x | Token-based API authentication |
| MySQL | 8.0 | Database |
| Eloquent ORM | — | Query builder & relasi model |
| Laravel Tinker | 2.x | REPL interaktif |

---

## Requirement

| Komponen | Versi Minimum |
|---|---|
| PHP | 8.1 |
| Composer | 2.x |
| MySQL | 8.0 |
| Git | 2.x |

**Ekstensi PHP yang harus aktif:** `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `tokenizer`, `xml`

---

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/username/rt-management.git
cd rt-management/rt-management-backend
```

### 2. Install dependencies

```bash
composer install
```

### 3. Konfigurasi environment

```bash
cp .env.example .env
```

Buka `.env` dan sesuaikan:

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

### 4. Buat database

Masuk ke MySQL dan jalankan:

```sql
CREATE DATABASE rt_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Generate application key

```bash
php artisan key:generate
```

### 6. Jalankan migrasi dan seeder

```bash
php artisan migrate --seed
```

Seeder akan membuat data awal:
- 1 akun admin RT (`admin@rt.com` / `password`)
- 20 rumah (15 tetap di Blok A & B, 5 kontrakan di Blok C)
- 17 penghuni (15 tetap, 2 kontrakan dengan kontrak 6 bulan)
- 2 jenis iuran (Satpam Rp 100.000, Kebersihan Rp 15.000)
- 360 data pembayaran tahun 2025 (semua lunas)
- 26 data pengeluaran tahun 2025

### 7. Buat symbolic link storage

```bash
php artisan storage:link
```

> Diperlukan agar foto KTP yang diupload dapat diakses via URL publik di `public/storage/`.

### 8. Jalankan server

```bash
php artisan serve
```

Backend berjalan di: **http://localhost:8000**

---

## Akun Default

| Field | Value |
|---|---|
| Email | `admin@rt.com` |
| Password | `password` |

---

## Struktur Proyek

```
app/
├── Http/
│   ├── Controllers/Api/    # Controller REST API
│   │   ├── AuthController.php
│   │   ├── HouseController.php
│   │   ├── ResidentController.php
│   │   ├── PaymentController.php
│   │   ├── PaymentTypeController.php
│   │   ├── ExpenseController.php
│   │   ├── ReportController.php
│   │   └── Public/
│   │       └── PublicResidentController.php
│   └── Requests/           # Form Request validasi
├── Models/
│   ├── User.php
│   ├── House.php
│   ├── Resident.php
│   ├── HouseResident.php   # Pivot histori penghuni per rumah
│   ├── Payment.php
│   ├── PaymentType.php
│   └── Expense.php
└── Services/               # Business logic layer
database/
├── migrations/
└── seeders/
    ├── DatabaseSeeder.php
    ├── UserSeeder.php
    ├── PaymentTypeSeeder.php
    ├── HouseSeeder.php
    ├── PaymentSeeder.php
    └── ExpenseSeeder.php
routes/
└── api.php                 # Semua route API prefix /api/v1
storage/
└── app/public/ktp/         # Foto KTP penghuni
```

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

Seluruh endpoint (kecuali login dan public) memerlukan header:
```
Authorization: Bearer <sanctum_token>
Accept: application/json
```

---

### Authentication

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/login` | Login, mendapat token |
| POST | `/auth/logout` | Logout, revoke token |
| GET | `/auth/me` | Informasi user yang login |

---

### Rumah

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/houses` | Daftar semua rumah |
| POST | `/houses` | Tambah rumah baru |
| GET | `/houses/{id}` | Detail rumah + histori penghuni + histori pembayaran |
| PUT | `/houses/{id}` | Update data rumah |
| POST | `/houses/{id}/assign-resident` | Tetapkan penghuni ke rumah |
| POST | `/houses/{id}/unassign-resident` | Pindahkan / kosongkan penghuni |

---

### Penghuni

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/residents` | Daftar semua penghuni |
| POST | `/residents` | Tambah penghuni baru (multipart/form-data untuk foto KTP) |
| GET | `/residents/{id}` | Detail penghuni |
| PUT | `/residents/{id}` | Update data penghuni |
| DELETE | `/residents/{id}` | Hapus penghuni |

---

### Jenis Iuran

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/payment-types` | Daftar jenis iuran |
| PUT | `/payment-types/{id}` | Update nominal iuran |

---

### Pembayaran (Pemasukan)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/payments` | Daftar pembayaran (filter: month, year, status, type) |
| POST | `/payments` | Catat pembayaran manual |
| GET | `/payments/{id}` | Detail pembayaran |
| DELETE | `/payments/{id}` | Hapus pembayaran |
| POST | `/payments/generate-monthly` | Generate tagihan bulanan otomatis |
| PUT | `/payments/{id}/mark-paid` | Tandai lunas |

---

### Pengeluaran

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/expenses` | Daftar pengeluaran (filter: month, year, category) |
| POST | `/expenses` | Tambah pengeluaran |
| PUT | `/expenses/{id}` | Update pengeluaran |
| DELETE | `/expenses/{id}` | Hapus pengeluaran |

---

### Laporan

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/reports/dashboard` | Statistik dashboard + grafik 12 bulan |
| GET | `/reports/summary?year=2025` | Ringkasan tahunan per bulan |
| GET | `/reports/monthly-detail?month=1&year=2025` | Detail pemasukan & pengeluaran per bulan |
| GET | `/reports/unpaid?month=1&year=2025` | Daftar tunggakan bulan tertentu |

---

### Public (Tanpa Auth)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/public/residents` | Daftar penghuni aktif (portal warga) |
| GET | `/public/residents/{houseNumber}` | Info penghuni berdasarkan nomor rumah |

---

## Model & Relasi

```
User
House          ──< HouseResident >── Resident   (many-to-many dengan histori)
House          ──< Payment                       (one-to-many)
PaymentType    ──< Payment
Expense                                          (standalone)
```

- `HouseResident` menyimpan histori kapan seorang penghuni menempati suatu rumah (`start_date`, `end_date`, `is_active`)
- `Payment` terhubung ke `House`, `Resident`, dan `PaymentType`
- `Expense` memiliki flag `is_recurring` untuk pengeluaran rutin bulanan

---

## Perintah Berguna

```bash
# Reset database dan jalankan ulang seeder
php artisan migrate:fresh --seed

# Clear semua cache
php artisan optimize:clear

# Lihat semua route yang terdaftar
php artisan route:list --path=api

# Buka REPL interaktif
php artisan tinker
```

---

## Troubleshooting

### `php artisan migrate` gagal
Pastikan database `rt_management` sudah dibuat dan kredensial di `.env` benar.

### Foto KTP tidak bisa diakses
Jalankan ulang `php artisan storage:link`. Pastikan folder `public/storage` terbentuk dan mengarah ke `storage/app/public`.

### CORS error dari frontend
Pastikan `APP_URL` di `.env` sesuai. Cek `config/cors.php`, tambahkan origin frontend:
```php
'allowed_origins' => ['http://localhost:5173'],
```
Lalu jalankan `php artisan config:clear`.

### `composer install` gagal
Cek versi PHP minimal 8.1 dengan `php -v` dan pastikan ekstensi yang dibutuhkan aktif.
