import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createExpense, getExpenses, updateExpense } from '../../api/expenseApi'
import useNotificationStore from '../../store/notificationStore'
import { EXPENSE_CATEGORY_OPTIONS } from '../../utils/constants'
import { MONTH_LABELS } from '../../utils/formatter'

const emptyForm = {
  category: 'gaji_satpam',
  description: '',
  amount: '',
  expense_date: new Date().toISOString().slice(0, 10),
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  is_recurring: false,
  notes: '',
}

const now = new Date()

export default function ExpenseFormPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isEdit    = Boolean(id)
  const { addNotification } = useNotificationStore()

  const [form, setForm]       = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      // Ambil data expense dari list (tidak ada endpoint GET single expense)
      // Gunakan filter yang sangat lebar lalu cari by id
      getExpenses({ year: now.getFullYear() })
        .then((res) => {
          const found = res.data.data.find((e) => String(e.id) === String(id))
          if (found) {
            setForm({
              category:     found.category ?? 'gaji_satpam',
              description:  found.description ?? '',
              amount:       found.amount ?? '',
              expense_date: found.expense_date?.slice(0, 10) ?? '',
              month:        found.month ?? new Date().getMonth() + 1,
              year:         found.year ?? new Date().getFullYear(),
              is_recurring: found.is_recurring ?? false,
              notes:        found.notes ?? '',
            })
          }
        })
        .finally(() => setFetching(false))
    }
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        month:  Number(form.month),
        year:   Number(form.year),
      }
      if (isEdit) {
        await updateExpense(id, payload)
        addNotification('Pengeluaran berhasil diperbarui', 'success')
      } else {
        await createExpense(payload)
        addNotification('Pengeluaran berhasil dicatat', 'success')
      }
      navigate('/expenses')
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

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  if (fetching) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Memuat data...</div>

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/expenses')} className="text-gray-400 hover:text-gray-600 text-sm">← Kembali</button>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {/* Kategori */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            name="category"
            value={form.category} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {EXPENSE_CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <input
            name="description" required
            value={form.description} onChange={handleChange}
            placeholder="Contoh: Gaji satpam bulan Januari"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Nominal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
          <input
            type="number" name="amount" required min="1"
            value={form.amount} onChange={handleChange}
            placeholder="Contoh: 500000"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Tanggal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pengeluaran</label>
          <input
            type="date" name="expense_date" required
            value={form.expense_date} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Bulan & Tahun */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
            <select
              name="month"
              value={form.month} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {MONTH_LABELS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
            <select
              name="year"
              value={form.year} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Rutin */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox" id="is_recurring" name="is_recurring"
            checked={form.is_recurring} onChange={handleChange}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="is_recurring" className="text-sm text-gray-700">
            Pengeluaran rutin bulanan
          </label>
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
          <input
            type="text" name="notes"
            value={form.notes} onChange={handleChange}
            placeholder="Dikerjakan oleh..."
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button" onClick={() => navigate('/expenses')}
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
