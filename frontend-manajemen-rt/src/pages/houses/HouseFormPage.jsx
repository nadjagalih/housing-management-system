import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createHouse, getHouse, updateHouse } from '../../api/houseApi'
import useNotificationStore from '../../store/notificationStore'
import { HOUSE_TYPES } from '../../utils/constants'

const emptyForm = { house_number: '', block: '', address: '', house_type: 'tetap', notes: '' }

export default function HouseFormPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isEdit    = Boolean(id)
  const { addNotification } = useNotificationStore()

  const [form, setForm]       = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      getHouse(id)
        .then((res) => {
          const d = res.data.data
          setForm({
            house_number: d.house_number ?? '',
            block:        d.block ?? '',
            address:      d.address ?? '',
            house_type:   d.house_type ?? 'tetap',
            notes:        d.notes ?? '',
          })
        })
        .finally(() => setFetching(false))
    }
  }, [id, isEdit])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await updateHouse(id, form)
        addNotification('Rumah berhasil diperbarui', 'success')
      } else {
        await createHouse(form)
        addNotification('Rumah berhasil ditambahkan', 'success')
      }
      navigate('/houses')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Terjadi kesalahan'
      addNotification(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Memuat data...</div>

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/houses')} className="text-gray-400 hover:text-gray-600 text-sm">← Kembali</button>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Rumah' : 'Tambah Rumah'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rumah</label>
            <input
              name="house_number" required
              value={form.house_number} onChange={handleChange}
              placeholder="Contoh: A1"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blok</label>
            <input
              name="block" required
              value={form.block} onChange={handleChange}
              placeholder="Contoh: A"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <input
            name="address" required
            value={form.address} onChange={handleChange}
            placeholder="Contoh: Jl. Perumahan No. 1"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Rumah</label>
          <select
            name="house_type"
            value={form.house_type} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {HOUSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
          <textarea
            name="notes"
            value={form.notes} onChange={handleChange}
            rows={3}
            placeholder="Catatan tambahan..."
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button" onClick={() => navigate('/houses')}
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
