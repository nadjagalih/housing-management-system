import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createResident, getResident, updateResident } from '../../api/residentApi'
import { assignResident, getHouses } from '../../api/houseApi'
import useNotificationStore from '../../store/notificationStore'
import { RESIDENT_TYPES, MARITAL_STATUS } from '../../utils/constants'

const emptyForm = {
  full_name: '', phone_number: '', resident_type: 'tetap', marital_status: 'married',
}

export default function ResidentFormPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isEdit    = Boolean(id)
  const { addNotification } = useNotificationStore()
  const fileRef   = useRef(null)

  const [form, setForm]           = useState(emptyForm)
  const [ktpFile, setKtpFile]     = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(isEdit)
  const [existingKtp, setExistingKtp] = useState('')
  const [currentHouse, setCurrentHouse] = useState(null)

  // State untuk penempatan rumah (hanya mode create)
  const [houses, setHouses]               = useState([])
  const [selectedHouseId, setSelectedHouseId] = useState('')
  const [contractDuration, setContractDuration] = useState('')

  const isKontrak = form.resident_type === 'kontrak'

  useEffect(() => {
    if (isEdit) {
      getResident(id)
        .then((res) => {
          const d = res.data.data
          setForm({
            full_name:      d.full_name ?? '',
            phone_number:   d.phone_number ?? '',
            resident_type:  d.resident_type ?? 'tetap',
            marital_status: d.marital_status ?? 'married',
          })
          setExistingKtp(d.ktp_photo_url ?? '')
          setCurrentHouse(d.current_house ?? null)
        })
        .finally(() => setFetching(false))
    } else {
      // Fetch rumah kosong hanya untuk mode tambah
      getHouses({ status: 'empty' }).then((res) => setHouses(res.data.data ?? []))
    }
  }, [id, isEdit])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setKtpFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveKtp = (e) => {
    e.stopPropagation()
    setKtpFile(null)
    setPreviewUrl('')
    setExistingKtp('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validasi: jika rumah dipilih dan tipe kontrak, durasi wajib diisi
    if (!isEdit && selectedHouseId && isKontrak && !contractDuration) {
      addNotification('Durasi kontrak wajib diisi.', 'error')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (ktpFile) fd.append('ktp_photo', ktpFile)
      // Jika KTP dihapus dan tidak ada file baru, beri tahu backend untuk menghapus file lama
      if (isEdit && !ktpFile && !existingKtp) fd.append('remove_ktp', '1')
      if (isEdit)  fd.append('_method', 'PUT')

      // Request 1: simpan data penghuni
      const residentRes = isEdit
        ? await updateResident(id, fd)
        : await createResident(fd)

      // Request 2: assign ke rumah jika dipilih (hanya saat create)
      if (!isEdit && selectedHouseId) {
        await assignResident(selectedHouseId, {
          resident_id:       residentRes.data.data.id,
          start_date:        new Date().toISOString().split('T')[0],
          contract_duration: isKontrak ? Number(contractDuration) : null,
          notes:             null,
        })
      }

      addNotification(
        isEdit ? 'Data penghuni berhasil diperbarui' : 'Penghuni berhasil ditambahkan',
        'success'
      )
      navigate(isEdit ? `/residents/${id}` : '/residents')
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors
        ? Object.values(errors).flat().join(', ')
        : (err.response?.data?.message ?? 'Terjadi kesalahan')
      addNotification(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Memuat data...</div>

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/residents')} className="text-gray-400 hover:text-gray-600 text-sm">← Kembali</button>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Penghuni' : 'Tambah Penghuni'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input
            name="full_name" required
            value={form.full_name} onChange={handleChange}
            placeholder="Contoh: Budi Santoso"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
          <input
            name="phone_number" required
            value={form.phone_number} onChange={handleChange}
            placeholder="Contoh: 081234567890"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Penghuni</label>
            <select
              name="resident_type"
              value={form.resident_type} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {RESIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Pernikahan</label>
            <select
              name="marital_status"
              value={form.marital_status} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {MARITAL_STATUS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {/* Upload KTP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Foto KTP {isEdit && <span className="text-gray-400 font-normal">(kosongkan jika tidak ingin mengganti)</span>}
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 transition-colors relative"
            onClick={() => fileRef.current?.click()}
          >
            {previewUrl || existingKtp ? (
              <>
                <img
                  src={previewUrl || existingKtp}
                  alt="Preview KTP"
                  className="h-28 mx-auto rounded object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none' }}
                />
                <button
                  type="button"
                  onClick={handleRemoveKtp}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs leading-none shadow"
                  title="Hapus foto KTP"
                >
                  ✕
                </button>
              </>
            ) : (
              <div className="text-gray-400 text-sm">
                <p className="text-2xl mb-1">📷</p>
                <p>Klik untuk upload foto KTP</p>
                <p className="text-xs mt-1">JPG/PNG, maks 2MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Penempatan Rumah — hanya tampil saat mode tambah */}
        {!isEdit && (
          <div className="border-t pt-4 space-y-4">
            <p className="text-sm font-medium text-gray-700">
              Penempatan Rumah
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </p>

            {/* Pilih Rumah */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Rumah</label>
              <select
                value={selectedHouseId}
                onChange={(e) => {
                  setSelectedHouseId(e.target.value)
                  setContractDuration('')
                }}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Contoh: 6"
                />
                <p className="text-xs text-gray-400 mt-1">Wajib diisi karena penghuni bertipe kontrak.</p>
              </div>
            )}
          </div>
        )}

        {/* Hunian Saat Ini — hanya tampil saat mode edit */}
        {isEdit && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Hunian Saat Ini</p>
            {currentHouse ? (
              <div className="flex items-center justify-between bg-slate-50 border rounded-lg px-3 py-2.5">
                <div className="text-sm">
                  <span className="font-medium text-gray-800">
                    Blok {currentHouse.block} — {currentHouse.house_number}
                  </span>
                  <span className="text-gray-400 ml-2 text-xs">sedang dihuni</span>
                </div>
                <span className="text-xs text-gray-400 italic">Perubahan hunian dilakukan di halaman rumah</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 border rounded-lg px-3 py-2.5 bg-gray-50 italic">Belum memiliki hunian aktif</p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button" onClick={() => navigate('/residents')}
            className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit" disabled={loading}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
