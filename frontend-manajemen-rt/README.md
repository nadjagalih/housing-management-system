# Sistem Manajemen RT — Frontend

Aplikasi web frontend untuk sistem manajemen administrasi RT (Rukun Tetangga), mencakup pengelolaan penghuni, rumah, pembayaran iuran, pengeluaran, dan pelaporan keuangan.

Dibangun dengan **React 19 + Vite 7 + Tailwind CSS v4**, berkomunikasi dengan backend Laravel melalui REST API.

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| React | 19.x | UI library |
| Vite | 7.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| React Router | 7.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Zustand | 5.x | State management (auth) |
| Recharts | 3.x | Grafik & visualisasi data |
| React Hook Form | 7.x | Form state & validasi |
| Day.js | 1.x | Manipulasi tanggal |
| xlsx (SheetJS) | 0.18.x | Export laporan ke Excel |
| jsPDF + autoTable | 4.x / 5.x | Export laporan ke PDF |

---

## Fitur Aplikasi

### 🔐 Autentikasi
- Login dengan email & password
- Token disimpan via Zustand (persisted)
- Protected routes — redirect otomatis ke `/login` jika belum login
- Logout dari Topbar

---

### 📊 Dashboard
- Ringkasan statistik: total rumah, penghuni aktif, total pemasukan bulan ini, saldo bulan ini
- Kartu statistik dengan indikator perubahan
- Grafik pemasukan vs pengeluaran selama 12 bulan (Recharts)
- Tabel pembayaran terbaru
- Tabel tunggakan aktif

---

### 🏠 Manajemen Rumah
| Path | Keterangan |
|---|---|
| `/houses` | Daftar semua rumah dengan filter status & tipe |
| `/houses/new` | Tambah rumah baru |
| `/houses/:id` | Detail rumah: info, penghuni aktif, histori penghuni, histori pembayaran |
| `/houses/:id/edit` | Edit data rumah |

**Fitur:**
- Daftar rumah dengan badge status (Dihuni / Kosong) dan tipe (Tetap / Kontrakan)
- Pencarian berdasarkan nomor rumah atau nama penghuni
- Detail rumah menampilkan histori semua penghuni yang pernah menempati
- Histori pembayaran per rumah dengan status lunas/belum
- Tambah / ganti penghuni langsung dari halaman detail rumah

---

### 👤 Manajemen Penghuni
| Path | Keterangan |
|---|---|
| `/residents` | Daftar semua penghuni |
| `/residents/new` | Tambah penghuni baru |
| `/residents/:id` | Detail penghuni |
| `/residents/:id/edit` | Edit data penghuni |

**Atribut penghuni:**
- Nama lengkap
- Nomor telepon
- Status penghuni (Tetap / Kontrakan)
- Status pernikahan (Sudah Menikah / Belum)
- Foto KTP (upload file, disimpan di storage backend)
- Tanggal mulai & akhir kontrak (khusus penghuni kontrakan)

---

### 💰 Manajemen Pembayaran (Pemasukan)
| Path | Keterangan |
|---|---|
| `/payments` | Daftar semua pembayaran iuran |
| `/payments/new` | Catat pembayaran baru |

**Fitur:**
- Filter berdasarkan bulan, tahun, status, dan jenis iuran
- Catat pembayaran untuk penghuni rumah tertentu
- Jenis iuran: Satpam (Rp 100.000/bulan) & Kebersihan (Rp 15.000/bulan)
- Status pembayaran: Lunas / Belum Lunas
- Dukungan pembayaran dimuka (advance payment)

---

### 📤 Manajemen Pengeluaran
| Path | Keterangan |
|---|---|
| `/expenses` | Daftar semua pengeluaran |
| `/expenses/new` | Tambah pengeluaran baru |
| `/expenses/:id/edit` | Edit pengeluaran |

**Fitur:**
- Kategori pengeluaran: Gaji Satpam, Perbaikan, Listrik, Kebersihan, Lainnya
- Tandai pengeluaran rutin bulanan (`is_recurring`)
- Filter berdasarkan bulan, tahun, dan kategori

---

### 📈 Laporan Keuangan

#### Laporan Tahunan (`/reports/summary`)
- Ringkasan keuangan per tahun dengan total pemasukan, pengeluaran, dan saldo
- Grafik batang pemasukan vs pengeluaran selama 12 bulan
- Tabel breakdown bulanan
- **Export ke Excel** — satu sheet berisi 12 baris bulanan + baris TOTAL
- **Export ke PDF** — layout A4 portrait dengan tabel ringkasan dan detail

#### Laporan Bulanan (`/reports/monthly`)
- Detail transaksi untuk bulan dan tahun tertentu
- Tab **Detail Transaksi**: tabel pemasukan per rumah + tabel pengeluaran per kategori
- Tab **Tunggakan**: daftar rumah yang belum lunas beserta nominal tunggakan
- Kartu summary: Pemasukan, Pengeluaran, Saldo bulan tersebut
- **Export ke Excel** — 3 sheet: Pemasukan, Pengeluaran, Tunggakan
- **Export ke PDF** — tabel pemasukan dan pengeluaran dalam satu dokumen

---

## Struktur Proyek

```
src/
├── api/                    # Fungsi pemanggil REST API (per modul)
│   ├── axios.js            # Konfigurasi Axios + interceptor token
│   ├── authApi.js
│   ├── houseApi.js
│   ├── residentApi.js
│   ├── paymentApi.js
│   ├── expenseApi.js
│   └── reportApi.js
├── components/
│   ├── charts/
│   │   └── IncomeExpenseChart.jsx
│   ├── layout/
│   │   ├── AdminLayout.jsx  # Layout utama dengan Sidebar + Topbar
│   │   ├── Sidebar.jsx
│   │   └── Topbar.jsx
│   └── ui/                  # Komponen reusable
│       ├── Badge.jsx
│       ├── ConfirmDialog.jsx
│       ├── EmptyState.jsx
│       ├── Modal.jsx
│       └── Notifications.jsx
├── pages/
│   ├── auth/LoginPage.jsx
│   ├── dashboard/DashboardPage.jsx
│   ├── houses/
│   ├── residents/
│   ├── payments/
│   ├── expenses/
│   └── reports/
├── routes/AppRouter.jsx
├── store/
│   ├── authStore.js         # Zustand store untuk token & user
│   └── notificationStore.js
└── utils/
    ├── constants.js         # Label bulan, kategori, dll.
    └── formatter.js         # Format Rupiah, tanggal
```

---

## Instalasi & Menjalankan

### Requirement

| Komponen | Versi Minimum |
|---|---|
| Node.js | 18.x |
| NPM | 9.x |

> Backend Laravel harus sudah berjalan di `http://localhost:8000`. Lihat panduan instalasi backend di repo backend.

### 1. Clone repository

```bash
git clone https://github.com/username/rt-management.git
cd rt-management/rt-management-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment

Salin file contoh environment:

```bash
cp .env.example .env
```

Buka `.env` dan sesuaikan:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Jalankan development server

```bash
npm run dev
```

Aplikasi berjalan di: **http://localhost:5173**

---

## Scripts

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Jalankan dev server (HMR aktif) |
| `npm run build` | Build untuk production ke folder `dist/` |
| `npm run preview` | Preview hasil build production |
| `npm run lint` | Jalankan ESLint untuk cek kode |

---

## Akun Default

Setelah backend seeder berhasil dijalankan:

| Field | Value |
|---|---|
| Email | `admin@rt.com` |
| Password | `password` |

---

## Konfigurasi API

Semua request API menggunakan base URL dari `VITE_API_URL`. Token autentikasi (Laravel Sanctum) dikirim otomatis via header `Authorization: Bearer <token>` melalui interceptor Axios di [`src/api/axios.js`](src/api/axios.js).

Jika token kadaluarsa atau tidak valid, interceptor akan melakukan logout otomatis dan redirect ke halaman login.

---

## Troubleshooting

### CORS error saat request ke backend
Pastikan `VITE_API_URL` sesuai dengan URL backend. Cek juga konfigurasi CORS di backend (`config/cors.php`) sudah mengizinkan `http://localhost:5173`.

### Foto KTP tidak muncul
Pastikan backend sudah menjalankan `php artisan storage:link` dan `VITE_API_URL` terisi dengan benar.

### `npm install` gagal
Pastikan Node.js versi minimal 18.x:
```bash
node -v
```

### Halaman kosong setelah login
Pastikan backend berjalan dan dapat diakses. Cek console browser untuk error API.
