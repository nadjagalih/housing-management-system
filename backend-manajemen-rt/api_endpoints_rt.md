# 🔌 API Endpoint Reference — Sistem Manajemen RT

> **Base URL:** `http://localhost:8000/api/v1`
> **Auth:** Laravel Sanctum — `Authorization: Bearer {token}`
> **Total Endpoint:** 33 endpoint

---

## Daftar Isi
- [Authentication](#authentication)
- [Houses — Manajemen Rumah](#houses--manajemen-rumah)
- [Residents — Manajemen Penghuni](#residents--manajemen-penghuni)
- [Payment Types — Jenis Iuran](#payment-types--jenis-iuran)
- [Payments — Pembayaran Iuran](#payments--pembayaran-iuran)
- [Expenses — Pengeluaran RT](#expenses--pengeluaran-rt)
- [Reports — Laporan & Grafik](#reports--laporan--grafik)
- [Public — Portal Warga *(Opsional)*](#public--portal-warga-opsional)

---

## Authentication

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| POST | `/auth/login` | Public | Login admin RT |
| POST | `/auth/logout` | ✅ | Logout, hapus token |
| GET | `/auth/me` | ✅ | Data user yang sedang login |

---

### POST `/auth/login`

**Request Body:**
```json
{
  "email": "admin@rt.com",
  "password": "secret123"
}
```

**Response 200:**
```json
{
  "token": "1|abcxyz...",
  "user": {
    "id": 1,
    "name": "Bapak RT",
    "role": "admin"
  }
}
```

---

### POST `/auth/logout`

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

### GET `/auth/me`

**Response 200:**
```json
{
  "id": 1,
  "name": "Bapak RT",
  "email": "admin@rt.com",
  "role": "admin"
}
```

---

## Houses — Manajemen Rumah

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/houses` | ✅ | List semua rumah |
| GET | `/houses/{id}` | ✅ | Detail rumah + history penghuni & pembayaran |
| POST | `/houses` | ✅ | Tambah rumah baru |
| PUT | `/houses/{id}` | ✅ | Update data rumah |
| POST | `/houses/{id}/assign-resident` | ✅ | Assign penghuni ke rumah |
| POST | `/houses/{id}/unassign-resident` | ✅ | Lepas penghuni dari rumah |

---

### GET `/houses`

**Query Parameters:**
- `?status=occupied|empty`
- `?type=permanent|flexible`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "house_number": "A1",
      "block": "A",
      "address": "Jl. Perumahan Elite No.1",
      "status": "occupied",
      "house_type": "permanent",
      "active_resident": {
        "id": 3,
        "full_name": "Budi Santoso",
        "phone_number": "081234567890",
        "resident_type": "permanent"
      }
    }
  ],
  "meta": { "total": 20, "occupied": 15, "empty": 5 }
}
```

---

### GET `/houses/{id}`

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "house_number": "A1",
    "status": "occupied",
    "active_resident": { "..." },
    "resident_history": [
      {
        "resident": { "full_name": "Budi Santoso" },
        "start_date": "2023-01-01",
        "end_date": null,
        "is_active": true
      }
    ],
    "payment_history": [
      {
        "month": 1,
        "year": 2025,
        "resident": { "full_name": "Budi Santoso" },
        "payments": [
          { "type": "satpam", "status": "paid", "amount": 100000 },
          { "type": "kebersihan", "status": "unpaid", "amount": 15000 }
        ]
      }
    ]
  }
}
```

---

### POST `/houses`

**Request Body:**
```json
{
  "house_number": "B5",
  "block": "B",
  "address": "Jl. Perumahan Elite No.15",
  "house_type": "flexible",
  "notes": "Rumah pojok"
}
```

**Response 201:**
```json
{
  "message": "Rumah berhasil ditambahkan",
  "data": { "id": 21, "house_number": "B5" }
}
```

---

### PUT `/houses/{id}`

**Request Body** *(semua field opsional)*:
```json
{
  "address": "Jl. Baru No.5",
  "notes": "Catatan diperbarui"
}
```

**Response 200:**
```json
{ "message": "Rumah berhasil diperbarui", "data": { "..." } }
```

---

### POST `/houses/{id}/assign-resident`

> ⚠️ Jika rumah sudah ada penghuni aktif, endpoint ini otomatis mengisi `end_date` penghuni lama sebelum assign penghuni baru.

**Request Body:**
```json
{
  "resident_id": 5,
  "start_date": "2025-02-01",
  "contract_duration": 6,
  "notes": "Kontrak 6 bulan"
}
```

**Response 200:**
```json
{
  "message": "Penghuni berhasil di-assign",
  "data": {
    "house_id": 1,
    "resident_id": 5,
    "start_date": "2025-02-01",
    "is_active": true
  }
}
```

---

### POST `/houses/{id}/unassign-resident`

**Request Body:**
```json
{
  "end_date": "2025-07-31",
  "notes": "Kontrak selesai"
}
```

**Response 200:**
```json
{ "message": "Penghuni berhasil dilepas dari rumah" }
```

---

## Residents — Manajemen Penghuni

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/residents` | ✅ | List semua penghuni |
| GET | `/residents/{id}` | ✅ | Detail penghuni + history rumah |
| POST | `/residents` | ✅ | Tambah penghuni baru |
| PUT | `/residents/{id}` | ✅ | Update data penghuni |
| DELETE | `/residents/{id}` | ✅ | Soft delete penghuni |

---

### GET `/residents`

**Query Parameters:**
- `?type=permanent|contract`
- `?search=nama`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "full_name": "Budi Santoso",
      "resident_type": "permanent",
      "phone_number": "081234567890",
      "marital_status": "married",
      "is_active": true,
      "current_house": { "id": 1, "house_number": "A1" }
    }
  ],
  "meta": { "total": 18, "permanent": 15, "contract": 3 }
}
```

---

### GET `/residents/{id}`

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "full_name": "Budi Santoso",
    "ktp_photo_url": "http://localhost:8000/storage/ktp/budi.jpg",
    "resident_type": "permanent",
    "phone_number": "081234567890",
    "marital_status": "married",
    "current_house": { "id": 1, "house_number": "A1", "block": "A" },
    "house_history": [
      { "house": { "house_number": "A1" }, "start_date": "2022-01-01", "end_date": null }
    ]
  }
}
```

---

### POST `/residents`

> ⚠️ Gunakan `multipart/form-data` karena ada upload foto KTP. Validasi: format jpg/png/jpeg, max 2MB.

**Request (multipart/form-data):**
```
full_name      : "Budi Santoso"
ktp_photo      : [file jpg/png, max 2MB]
resident_type  : "permanent" | "contract"
phone_number   : "081234567890"
marital_status : "married" | "single"
```

**Response 201:**
```json
{
  "message": "Penghuni berhasil ditambahkan",
  "data": {
    "id": 16,
    "full_name": "Budi Santoso",
    "ktp_photo_url": "http://localhost:8000/storage/ktp/..."
  }
}
```

---

### PUT `/residents/{id}`

> Gunakan `multipart/form-data` jika update foto KTP. Semua field opsional.

**Request:**
```
full_name      : "Budi S. Updated"   (opsional)
ktp_photo      : [file]              (opsional)
resident_type  : "contract"          (opsional)
phone_number   : "08999999999"       (opsional)
marital_status : "married"           (opsional)
```

**Response 200:**
```json
{ "message": "Data penghuni diperbarui", "data": { "..." } }
```

---

### DELETE `/residents/{id}`

> ⚠️ Soft delete — data tetap tersimpan untuk keperluan history. Tidak bisa delete jika penghuni masih aktif menghuni rumah.

**Response 200:**
```json
{ "message": "Penghuni berhasil dinonaktifkan" }
```

---

## Payment Types — Jenis Iuran

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/payment-types` | ✅ | List semua jenis iuran |
| PUT | `/payment-types/{id}` | ✅ | Update nominal iuran |

---

### GET `/payment-types`

**Response 200:**
```json
{
  "data": [
    { "id": 1, "name": "satpam", "amount": 100000, "is_active": true },
    { "id": 2, "name": "kebersihan", "amount": 15000, "is_active": true }
  ]
}
```

---

### PUT `/payment-types/{id}`

**Request Body:**
```json
{
  "amount": 120000,
  "description": "Naik per Januari 2026"
}
```

**Response 200:**
```json
{ "message": "Iuran berhasil diperbarui", "data": { "..." } }
```

---

## Payments — Pembayaran Iuran

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/payments` | ✅ | List tagihan |
| GET | `/payments/{id}` | ✅ | Detail satu tagihan |
| POST | `/payments/generate-monthly` | ✅ | Generate tagihan bulanan otomatis |
| POST | `/payments` | ✅ | Input pembayaran manual |
| PUT | `/payments/{id}/mark-paid` | ✅ | Tandai tagihan lunas |
| DELETE | `/payments/{id}` | ✅ | Hapus tagihan (koreksi data) |

---

### GET `/payments`

**Query Parameters:**
- `?month=1&year=2025`
- `?status=paid|unpaid`
- `?house_id=1`

**Response 200:**
```json
{
  "data": [
    {
      "id": 10,
      "house": { "house_number": "A1" },
      "resident": { "full_name": "Budi Santoso" },
      "payment_type": { "name": "satpam", "amount": 100000 },
      "month": 1,
      "year": 2025,
      "status": "paid",
      "payment_date": "2025-01-05"
    }
  ],
  "summary": {
    "total_tagihan": 20,
    "lunas": 14,
    "belum_lunas": 6
  }
}
```

---

### POST `/payments/generate-monthly`

> ⚠️ Idempotent: jika tagihan bulan tersebut sudah ada, endpoint ini akan skip dan tidak membuat duplikat. Dipanggil sekali di awal bulan untuk semua penghuni aktif.

**Request Body:**
```json
{ "month": 2, "year": 2025 }
```

**Response 201:**
```json
{
  "message": "Tagihan bulan Feb 2025 berhasil digenerate",
  "generated": 30,
  "skipped": 0
}
```

---

### POST `/payments`

> ⚠️ Jika `paid_months > 1`, sistem otomatis menandai tagihan bulan-bulan berikutnya sebagai lunas hingga cakupan bulan terpenuhi.

**Request Body:**
```json
{
  "house_id": 1,
  "resident_id": 3,
  "payment_type_id": 2,
  "month": 1,
  "year": 2025,
  "paid_months": 12,
  "payment_date": "2025-01-10",
  "notes": "Bayar kebersihan 1 tahun"
}
```

**Response 201:**
```json
{
  "message": "Pembayaran berhasil dicatat",
  "data": {
    "id": 55,
    "paid_months": 12,
    "status": "paid",
    "covers": "Jan - Dec 2025"
  }
}
```

---

### PUT `/payments/{id}/mark-paid`

**Request Body:**
```json
{
  "payment_date": "2025-02-03",
  "notes": "Bayar tunai"
}
```

**Response 200:**
```json
{ "message": "Tagihan berhasil ditandai lunas" }
```

---

### DELETE `/payments/{id}`

> ⚠️ Hanya bisa menghapus tagihan berstatus `unpaid`. Tagihan yang sudah lunas tidak bisa dihapus langsung.

**Response 200:**
```json
{ "message": "Data pembayaran berhasil dihapus" }
```

---

## Expenses — Pengeluaran RT

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/expenses` | ✅ | List pengeluaran |
| POST | `/expenses` | ✅ | Tambah pengeluaran baru |
| PUT | `/expenses/{id}` | ✅ | Update pengeluaran |
| DELETE | `/expenses/{id}` | ✅ | Hapus pengeluaran |

**Kategori yang tersedia:** `gaji_satpam` | `token_listrik` | `perbaikan_jalan` | `perbaikan_selokan` | `other`

---

### GET `/expenses`

**Query Parameters:**
- `?month=1&year=2025`
- `?category=gaji_satpam`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "category": "gaji_satpam",
      "description": "Gaji satpam bulan Januari",
      "amount": 2500000,
      "expense_date": "2025-01-31",
      "is_recurring": true
    }
  ],
  "summary": { "total_pengeluaran": 3200000 }
}
```

---

### POST `/expenses`

**Request Body:**
```json
{
  "category": "perbaikan_jalan",
  "description": "Tambal lubang depan blok B",
  "amount": 500000,
  "expense_date": "2025-01-20",
  "month": 1,
  "year": 2025,
  "is_recurring": false,
  "notes": "Dikerjakan pak Udin"
}
```

**Response 201:**
```json
{
  "message": "Pengeluaran berhasil dicatat",
  "data": { "id": 12, "..." }
}
```

---

### PUT `/expenses/{id}`

**Request Body** *(semua field opsional)*:
```json
{ "amount": 550000, "description": "Revisi nominal" }
```

**Response 200:**
```json
{ "message": "Pengeluaran diperbarui", "data": { "..." } }
```

---

### DELETE `/expenses/{id}`

**Response 200:**
```json
{ "message": "Pengeluaran berhasil dihapus" }
```

---

## Reports — Laporan & Grafik

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/reports/dashboard` | ✅ | Statistik ringkasan dashboard |
| GET | `/reports/summary` | ✅ | Grafik 12 bulan pemasukan & pengeluaran |
| GET | `/reports/monthly-detail` | ✅ | Detail transaksi bulan tertentu |
| GET | `/reports/unpaid` | ✅ | List tunggakan per penghuni |

---

### GET `/reports/dashboard`

**Response 200:**
```json
{
  "houses": { "total": 20, "occupied": 15, "empty": 5 },
  "residents": { "total": 15, "permanent": 12, "contract": 3 },
  "current_month": {
    "month_label": "Februari 2025",
    "pemasukan": 1725000,
    "pengeluaran": 2700000,
    "saldo": -975000,
    "tagihan_lunas": 22,
    "tagihan_belum_lunas": 8
  }
}
```

---

### GET `/reports/summary`

> 💡 Format response langsung kompatibel dengan Recharts / Chart.js untuk render grafik bar/line.

**Query Parameters:**
- `?year=2025`

**Response 200:**
```json
{
  "year": 2025,
  "data": [
    {
      "month": 1,
      "month_label": "Januari",
      "total_pemasukan": 1725000,
      "total_pengeluaran": 3200000,
      "saldo": -1475000
    },
    { "month": 2, "..." }
  ],
  "annual_summary": {
    "total_pemasukan": 18500000,
    "total_pengeluaran": 21000000,
    "saldo_akhir": -2500000
  }
}
```

---

### GET `/reports/monthly-detail`

**Query Parameters:**
- `?month=1&year=2025`

**Response 200:**
```json
{
  "month": 1,
  "year": 2025,
  "month_label": "Januari 2025",
  "pemasukan": {
    "total": 1725000,
    "items": [
      { "house": "A1", "resident": "Budi", "type": "satpam", "amount": 100000, "status": "paid" }
    ]
  },
  "pengeluaran": {
    "total": 3200000,
    "items": [
      { "category": "gaji_satpam", "description": "Gaji Jan", "amount": 2500000 },
      { "category": "token_listrik", "description": "Token pos", "amount": 200000 }
    ]
  },
  "saldo": -1475000
}
```

---

### GET `/reports/unpaid`

**Query Parameters:**
- `?month=1&year=2025`

**Response 200:**
```json
{
  "data": [
    {
      "house": { "house_number": "C3" },
      "resident": { "full_name": "Andi W.", "phone_number": "0812..." },
      "unpaid": [
        { "type": "satpam", "amount": 100000 },
        { "type": "kebersihan", "amount": 15000 }
      ],
      "total_tunggakan": 115000
    }
  ],
  "total_tunggakan": 575000
}
```

---

## Public — Portal Warga *(Opsional)*

> Endpoint ini bersifat **opsional / pengembangan**. Tidak memerlukan autentikasi. Data sensitif seperti foto KTP dan ID internal tidak ditampilkan.

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/public/residents` | Public | List kepala keluarga per rumah |
| GET | `/public/residents/{house_number}` | Public | Detail penghuni + status tagihan bulan ini |

---

### GET `/public/residents`

**Response 200:**
```json
{
  "data": [
    {
      "full_name": "Budi Santoso",
      "phone_number": "081234...",
      "marital_status": "married",
      "house": { "house_number": "A1", "block": "A" }
    }
  ]
}
```

---

### GET `/public/residents/{house_number}`

**Response 200:**
```json
{
  "house_number": "A1",
  "resident": {
    "full_name": "Budi Santoso",
    "phone_number": "081234...",
    "marital_status": "married"
  },
  "tagihan_bulan_ini": [
    { "type": "satpam", "amount": 100000, "status": "paid" },
    { "type": "kebersihan", "amount": 15000, "status": "unpaid" }
  ]
}
```

---

*Dokumentasi ini dibuat sebagai bagian dari Skill Fit Test — Full Stack Programmer Apprentice.*
