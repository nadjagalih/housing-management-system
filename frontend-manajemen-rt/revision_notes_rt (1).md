# 📝 Catatan Revisi — Sistem Manajemen RT

> Dokumen ini berisi revisi dan perbaikan dari implementation guide sebelumnya.
> Selalu rujuk dokumen ini jika ada konflik dengan guide sebelumnya — **dokumen ini lebih prioritas**.

---

## Revisi 1: `house_type` — Perubahan Nilai & Makna

### Perubahan Nilai Enum

| Sebelumnya | Sesudah |
|---|---|
| `permanent` | `tetap` |
| `flexible` | `kontrak` |

### Lokasi Perubahan

**Migration `houses` table:**
```php
// SEBELUM
$table->enum('house_type', ['permanent', 'flexible'])->default('permanent');

// SESUDAH
$table->enum('house_type', ['tetap', 'kontrak'])->default('tetap');
```

**Seeder `HouseSeeder.php`:**
```php
// 15 rumah blok A & B → tetap
'house_type' => 'tetap',

// 5 rumah blok C → kontrak
'house_type' => 'kontrak',
```

**`PaymentService.php` — logika generate tagihan:**
```php
foreach ($houses as $house) {

    // Rumah tetap → SELALU generate tagihan setiap bulan
    if ($house->house_type === 'tetap') {
        $this->createBilling($house, $month, $year);
    }

    // Rumah kontrak → generate tagihan HANYA jika sedang dihuni
    if ($house->house_type === 'kontrak' && $house->status === 'occupied') {
        $this->createBilling($house, $month, $year);
    }
}
```

**`constants.js` Frontend:**
```js
// SEBELUM
export const HOUSE_TYPES = [
  { value: 'permanent', label: 'Permanen' },
  { value: 'flexible',  label: 'Fleksibel' },
]

// SESUDAH
export const HOUSE_TYPES = [
  { value: 'tetap',   label: 'Tetap' },
  { value: 'kontrak', label: 'Kontrak' },
]
```

**`Badge.jsx` Frontend:**
```jsx
// Tambahkan di objek styles & labels
const styles = {
  // ... yang sudah ada ...
  tetap:   'bg-blue-100 text-blue-700',
  kontrak: 'bg-orange-100 text-orange-700',
}
const labels = {
  // ... yang sudah ada ...
  tetap:   'Tetap',
  kontrak: 'Kontrak',
}
```

---

## Revisi 2: Tampilan Nama Rumah di Detail Rumah

### Masalah
Judul halaman detail rumah menampilkan format **"Rumah A-A1"** yang redundan dan membingungkan karena blok dan nomor rumah digabung dengan tanda pisah.

### Solusi
Samakan format dengan halaman detail penghuni yang sudah benar, yaitu **"Blok A — A1"**.

### Perubahan di `HouseDetailPage.jsx`

```jsx
// SEBELUM — format lama yang salah
<h2>Rumah {house.block}-{house.house_number}</h2>

// SESUDAH — format baru yang konsisten
<h2>
  {house.block ? `Blok ${house.block} — ` : ''}{house.house_number}
</h2>
```

Untuk breadcrumb atau subtitle di bawah judul:
```jsx
// SEBELUM
<p>{house.address}</p>

// SESUDAH — tambahkan info blok di subtitle
<p>
  {house.block && <span>Blok {house.block} · </span>}
  {house.address}
</p>
```

> ✅ Format ini konsisten dengan tampilan di halaman detail penghuni yang sudah menampilkan **"Blok A — A1"** dengan benar.

---

## Revisi 3: Modal Assign Penghuni — Deteksi Tipe Penghuni Otomatis

### Latar Belakang & Alur yang Benar

Alur yang benar adalah:
```
1. Tambah penghuni dulu di menu Penghuni (dengan tipe: tetap/kontrak)
2. Baru assign penghuni tersebut ke rumah dari halaman detail rumah
```

Karena tipe penghuni (`resident_type`) sudah ditentukan saat penghuni dibuat, maka **modal assign tidak perlu dropdown tipe hunian lagi**. Cukup **deteksi otomatis** dari data penghuni yang dipilih.

### Behavior yang Diinginkan

```
Pilih penghuni "Budi" (tipe: tetap)
→ Field durasi kontrak TIDAK muncul
→ Kirim ke backend tanpa contract_duration

Pilih penghuni "Sari" (tipe: kontrak)
→ Field durasi kontrak OTOMATIS MUNCUL dan wajib diisi
→ Kirim ke backend dengan contract_duration
```

### Perubahan Backend

`AssignResidentRequest.php` — validasi `contract_duration` berdasarkan `resident_type` penghuni:

```php
public function rules(): array
{
    // Ambil tipe penghuni dari database
    $resident = \App\Models\Resident::find($this->resident_id);
    $isKontrak = $resident && $resident->resident_type === 'kontrak';

    return [
        'resident_id'       => 'required|exists:residents,id',
        'start_date'        => 'required|date',
        // Wajib diisi hanya jika penghuni bertipe kontrak
        'contract_duration' => $isKontrak
                                ? 'required|integer|min:1'
                                : 'nullable|integer|min:1',
        'notes'             => 'nullable|string',
    ];
}
```

`HouseService.php` — deteksi tipe dari resident, tidak dari request:

```php
public function assignResident(House $house, array $data): HouseResident
{
    // Nonaktifkan penghuni lama jika ada
    HouseResident::where('house_id', $house->id)
        ->where('is_active', true)
        ->update([
            'is_active' => false,
            'end_date'  => now()->toDateString(),
        ]);

    // Deteksi tipe dari data penghuni
    $resident      = \App\Models\Resident::findOrFail($data['resident_id']);
    $occupancyType = $resident->resident_type; // 'tetap' atau 'kontrak'

    // Hitung end_date otomatis hanya jika kontrak
    $endDate = null;
    if ($occupancyType === 'kontrak' && isset($data['contract_duration'])) {
        $endDate = \Carbon\Carbon::parse($data['start_date'])
            ->addMonths($data['contract_duration'])
            ->toDateString();
    }

    $houseResident = HouseResident::create([
        'house_id'          => $house->id,
        'resident_id'       => $data['resident_id'],
        'occupancy_type'    => $occupancyType,
        'start_date'        => $data['start_date'],
        'end_date'          => $endDate,
        'contract_duration' => $data['contract_duration'] ?? null,
        'notes'             => $data['notes'] ?? null,
        'is_active'         => true,
    ]);

    $house->update(['status' => 'occupied']);

    return $houseResident;
}
```

### Perubahan Frontend — `HouseDetailPage.jsx`

**State form assign — tanpa `occupancy_type`:**
```jsx
const [assignForm, setAssignForm] = useState({
  resident_id:       '',
  start_date:        '',
  contract_duration: '',
  notes:             '',
})

// Simpan data penghuni yang dipilih untuk deteksi tipe
const [selectedResident, setSelectedResident] = useState(null)

// Handler saat penghuni dipilih dari dropdown
const handleResidentChange = (residentId) => {
  const resident = residents.find((r) => r.id === parseInt(residentId))
  setSelectedResident(resident || null)
  setAssignForm({
    ...assignForm,
    resident_id:       residentId,
    contract_duration: '', // reset durasi saat ganti penghuni
  })
}

// Helper: apakah penghuni yang dipilih bertipe kontrak?
const isKontrak = selectedResident?.resident_type === 'kontrak'
```

**JSX Modal Assign — tanpa dropdown tipe, dengan deteksi otomatis:**
```jsx
<Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Penghuni">
  <div className="space-y-4">

    {/* Dropdown Penghuni */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Penghuni *</label>
      <select
        value={assignForm.resident_id}
        onChange={(e) => handleResidentChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        required
      >
        <option value="">Pilih penghuni...</option>
        {residents.map((r) => (
          <option key={r.id} value={r.id}>
            {r.full_name} — {r.resident_type === 'kontrak' ? 'Kontrak' : 'Tetap'}
          </option>
        ))}
      </select>
      {/* Info tipe penghuni yang dipilih */}
      {selectedResident && (
        <p className="text-xs mt-1 text-gray-400">
          Tipe penghuni:{' '}
          <span className={`font-medium ${
            isKontrak ? 'text-orange-500' : 'text-blue-500'
          }`}>
            {isKontrak ? 'Kontrak' : 'Tetap'}
          </span>
        </p>
      )}
    </div>

    {/* Durasi Kontrak — otomatis muncul jika penghuni bertipe kontrak */}
    {isKontrak && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Durasi Kontrak (bulan) *
        </label>
        <input
          type="number"
          min="1"
          value={assignForm.contract_duration}
          onChange={(e) => setAssignForm({ ...assignForm, contract_duration: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Contoh: 6"
          required
        />
        {/* Preview tanggal selesai kontrak otomatis */}
        {assignForm.start_date && assignForm.contract_duration && (
          <p className="text-xs text-blue-500 mt-1">
            📅 Kontrak selesai:{' '}
            {new Date(
              new Date(assignForm.start_date).setMonth(
                new Date(assignForm.start_date).getMonth() +
                parseInt(assignForm.contract_duration)
              )
            ).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        )}
      </div>
    )}

    {/* Tanggal Mulai */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
      <input
        type="date"
        value={assignForm.start_date}
        onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        required
      />
    </div>

    {/* Catatan */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
      <textarea
        value={assignForm.notes}
        onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        rows={2}
        placeholder="Kosongkan jika tidak ada"
      />
    </div>

    {/* Tombol */}
    <div className="flex justify-end gap-3 pt-2">
      <button
        onClick={() => setShowAssign(false)}
        className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
      >
        Batal
      </button>
      <button
        onClick={handleAssign}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
      >
        Assign
      </button>
    </div>
  </div>
</Modal>
```

**Handler submit assign:**
```jsx
const handleAssign = async () => {
  if (!assignForm.resident_id || !assignForm.start_date) {
    addNotification('Penghuni dan tanggal mulai wajib diisi.', 'error')
    return
  }
  if (isKontrak && !assignForm.contract_duration) {
    addNotification('Durasi kontrak wajib diisi untuk penghuni bertipe kontrak.', 'error')
    return
  }

  try {
    await assignResident(house.id, {
      resident_id:       assignForm.resident_id,
      start_date:        assignForm.start_date,
      contract_duration: isKontrak ? assignForm.contract_duration : null,
      notes:             assignForm.notes || null,
    })
    addNotification('Penghuni berhasil di-assign.')
    setShowAssign(false)
    setSelectedResident(null)
    fetchHouse()
  } catch (err) {
    const errors = err.response?.data?.errors
    const msg = errors
      ? Object.values(errors).flat().join(', ')
      : err.response?.data?.message || 'Terjadi kesalahan.'
    addNotification(msg, 'error')
  }
}
```

---

## Ringkasan Semua File yang Perlu Diubah

### Backend
| File | Perubahan |
|---|---|
| `create_houses_table.php` | Nilai enum `house_type`: `permanent→tetap`, `flexible→kontrak` |
| `create_house_residents_table.php` | Tambah kolom `occupancy_type` enum(`tetap`,`kontrak`) |
| `HouseSeeder.php` | Update nilai `house_type` ke `tetap` / `kontrak` |
| `AssignResidentRequest.php` | Validasi `contract_duration` berdasarkan `resident_type` penghuni |
| `HouseService.php` | Deteksi `occupancy_type` dari `resident_type`, hitung `end_date` otomatis |
| `PaymentService.php` | Update kondisi dari `permanent/flexible` ke `tetap/kontrak` |

### Frontend
| File | Perubahan |
|---|---|
| `constants.js` | Update nilai `HOUSE_TYPES` ke `tetap` / `kontrak` |
| `Badge.jsx` | Tambah style untuk nilai `tetap` dan `kontrak` |
| `HouseDetailPage.jsx` | Format judul `Blok X — NomorRumah`, deteksi tipe otomatis di modal assign |
| `ResidentFormPage.jsx` | Tambah kolom pilih rumah (opsional) + durasi kontrak kondisional |

---

## Revisi 4: Form Tambah Penghuni — Tambah Kolom Pilih Rumah (Opsional)

### Keputusan Desain

Form tambah penghuni diperkaya dengan kolom **pilih rumah yang bersifat opsional**. Jika rumah dipilih dan penghuni bertipe kontrak, kolom durasi kontrak otomatis muncul. Form assign di halaman detail rumah **tetap dipertahankan** untuk kasus assign penghuni yang sudah terdaftar sebelumnya.

```
Alur baru (tambah penghuni + langsung assign):
Isi data penghuni → Pilih rumah (opsional) → [jika kontrak] Isi durasi → Simpan

Alur lama (tetap ada):
Halaman detail rumah → Tombol Assign → Pilih penghuni yang sudah terdaftar → Simpan
```

### Perubahan Backend

Tidak perlu endpoint baru. Frontend cukup melakukan **dua request berurutan** jika rumah dipilih:

```
1. POST /api/v1/residents        → simpan data penghuni, dapat resident_id
2. POST /api/v1/houses/{id}/assign-resident → assign penghuni ke rumah
```

Jika kolom rumah dikosongkan, hanya request pertama yang dijalankan.

### Perubahan Frontend — `ResidentFormPage.jsx`

**Tambah state untuk pilihan rumah:**
```jsx
import { getHouses } from '../../api/houseApi'
import { assignResident } from '../../api/houseApi'

// Tambah state
const [houses, setHouses]           = useState([])
const [selectedHouseId, setSelectedHouseId] = useState('')
const [contractDuration, setContractDuration] = useState('')

// Fetch daftar rumah yang kosong saat komponen mount
useEffect(() => {
  getHouses({ status: 'empty' }).then((res) => setHouses(res.data.data))
}, [])

// Helper deteksi tipe kontrak
const isKontrak = form.resident_type === 'kontrak'
```

**Tambah JSX kolom rumah di form (setelah kolom foto KTP):**
```jsx
{/* Divider */}
<div className="border-t pt-4">
  <p className="text-sm font-medium text-gray-700 mb-3">
    Penempatan Rumah
    <span className="text-gray-400 font-normal ml-1">(opsional)</span>
  </p>

  {/* Pilih Rumah */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Pilih Rumah
    </label>
    <select
      value={selectedHouseId}
      onChange={(e) => {
        setSelectedHouseId(e.target.value)
        setContractDuration('') // reset durasi saat ganti rumah
      }}
      className="w-full border rounded-lg px-3 py-2 text-sm"
    >
      <option value="">— Tidak assign ke rumah sekarang —</option>
      {houses.map((h) => (
        <option key={h.id} value={h.id}>
          {h.block ? `Blok ${h.block} — ` : ''}{h.house_number} ({h.house_type === 'tetap' ? 'Tetap' : 'Kontrak'})
        </option>
      ))}
    </select>
    {houses.length === 0 && (
      <p className="text-xs text-gray-400 mt-1">Semua rumah sedang dihuni.</p>
    )}
  </div>

  {/* Durasi Kontrak — muncul jika rumah dipilih DAN penghuni bertipe kontrak */}
  {selectedHouseId && isKontrak && (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Durasi Kontrak (bulan) *
      </label>
      <input
        type="number"
        min="1"
        value={contractDuration}
        onChange={(e) => setContractDuration(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Contoh: 6"
      />
      <p className="text-xs text-gray-400 mt-1">
        Wajib diisi karena penghuni bertipe kontrak.
      </p>
    </div>
  )}
</div>
```

**Update handler submit — dua request berurutan:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault()

  // Validasi tambahan jika rumah dipilih dan tipe kontrak
  if (selectedHouseId && isKontrak && !contractDuration) {
    addNotification('Durasi kontrak wajib diisi.', 'error')
    return
  }

  setLoading(true)

  const formData = new FormData()
  Object.entries(form).forEach(([k, v]) => formData.append(k, v))
  if (ktpFile) formData.append('ktp_photo', ktpFile)
  if (isEdit)  formData.append('_method', 'PUT')

  try {
    // Request 1: simpan data penghuni
    const residentRes = isEdit
      ? await updateResident(id, formData)
      : await createResident(formData)

    const residentId = residentRes.data.data.id

    // Request 2: assign ke rumah jika dipilih (hanya saat create, bukan edit)
    if (!isEdit && selectedHouseId) {
      await assignResident(selectedHouseId, {
        resident_id:       residentId,
        start_date:        new Date().toISOString().split('T')[0], // default hari ini
        contract_duration: isKontrak ? contractDuration : null,
        notes:             null,
      })
    }

    addNotification(
      isEdit ? 'Data penghuni berhasil diperbarui.' : 'Penghuni berhasil ditambahkan.'
    )
    navigate('/residents')

  } catch (err) {
    const errors = err.response?.data?.errors
    const msg = errors
      ? Object.values(errors).flat().join(', ')
      : err.response?.data?.message || 'Terjadi kesalahan.'
    addNotification(msg, 'error')
  } finally {
    setLoading(false)
  }
}
```

> ⚠️ Kolom pilih rumah **hanya ditampilkan saat mode tambah (create)**, bukan saat edit penghuni. Untuk pindah rumah, gunakan fitur assign/unassign di halaman detail rumah.

> ⚠️ Daftar rumah yang ditampilkan di dropdown **hanya rumah berstatus `empty`** agar tidak bisa assign ke rumah yang sudah dihuni.

---

*Revisi ini berlaku mulai sesi diskusi 21 Februari 2026.*
