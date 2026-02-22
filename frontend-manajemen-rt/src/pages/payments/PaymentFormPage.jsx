import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPayment, getPaymentTypes, getPayments } from '../../api/paymentApi'
import { getHouses } from '../../api/houseApi'
import useNotificationStore from '../../store/notificationStore'
import { MONTH_LABELS } from '../../utils/formatter'

export default function PaymentFormPage() {
  const navigate = useNavigate()
  const { addNotification } = useNotificationStore()
  const now = new Date()

  const [form, setForm] = useState({
    house_id: '', resident_id: '', payment_type_id: '',
    month: now.getMonth() + 1, year: now.getFullYear(),
    paid_months: 1, payment_date: now.toISOString().slice(0, 10), notes: '',
  })
  const [houses, setHouses]             = useState([])
  const [paymentTypes, setPaymentTypes]   = useState([])
  const [paidTypeIds, setPaidTypeIds]     = useState(new Set())
  const [loading, setLoading]             = useState(false)

  useEffect(() => {
    getHouses().then((res) => setHouses(res.data.data))
    getPaymentTypes().then((res) => setPaymentTypes(res.data.data))
  }, [])

  // Fetch already-paid types for the selected house + month + year
  useEffect(() => {
    if (!form.house_id || !form.month || !form.year) {
      setPaidTypeIds(new Set())
      return
    }
    getPayments({ house_id: form.house_id, month: form.month, year: form.year })
      .then((res) => {
        const paid = new Set(
          res.data.data
            .filter((p) => p.status === 'paid')
            .map((p) => p.payment_type?.id)
            .filter(Boolean)
        )
        setPaidTypeIds(paid)
        // Reset selected type if it is now paid
        setForm((prev) => ({
          ...prev,
          payment_type_id: paid.has(Number(prev.payment_type_id)) ? '' : prev.payment_type_id,
        }))
      })
      .catch(() => setPaidTypeIds(new Set()))
  }, [form.house_id, form.month, form.year])

  const selectedHouse = houses.find((h) => String(h.id) === String(form.house_id))

  // Hitung batas maksimal paid_months untuk penghuni kontrak
  const maxPaidMonths = useMemo(() => {
    const ar = selectedHouse?.active_resident
    if (!ar || ar.occupancy_type !== 'kontrak' || !ar.end_date) return 12
    const end      = new Date(ar.end_date)
    const endMonth = end.getMonth() + 1
    const endYear  = end.getFullYear()
    const diff     = (endYear - Number(form.year)) * 12 + (endMonth - Number(form.month)) + 1
    return Math.max(1, diff)
  }, [selectedHouse, form.month, form.year])

  // Jika paid_months melebihi batas baru, reset otomatis
  useEffect(() => {
    if (Number(form.paid_months) > maxPaidMonths) {
      setForm((prev) => ({ ...prev, paid_months: maxPaidMonths }))
    }
  }, [maxPaidMonths, form.paid_months])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleHouseChange = (e) => {
    const house = houses.find((h) => String(h.id) === e.target.value)
    setForm((prev) => ({
      ...prev,
      house_id:        e.target.value,
      resident_id:     house?.active_resident?.id ? String(house.active_resident.id) : '',
      payment_type_id: '', // reset when house changes
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createPayment({
        ...form,
        house_id:        Number(form.house_id),
        resident_id:     Number(form.resident_id),
        payment_type_id: Number(form.payment_type_id),
        month:           Number(form.month),
        year:            Number(form.year),
        paid_months:     Number(form.paid_months),
      })
      addNotification('Pembayaran berhasil dicatat', 'success')
      navigate('/payments')
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

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/payments')} className="text-gray-400 hover:text-gray-600 text-sm">← Kembali</button>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Input Pembayaran Manual</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {/* Rumah */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rumah</label>
          <select
            name="house_id" required
            value={form.house_id} onChange={handleHouseChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Pilih rumah...</option>
            {houses.filter((h) => h.status === 'occupied').map((h) => (
              <option key={h.id} value={h.id}>
                {h.block}-{h.house_number} — {h.active_resident?.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Penghuni (auto-fill, readonly) */}
        {selectedHouse?.active_resident && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penghuni</label>
            <input
              readOnly
              value={selectedHouse.active_resident.full_name}
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500"
            />
          </div>
        )}

        {/* Jenis Iuran */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Iuran</label>
          <select
            name="payment_type_id" required
            value={form.payment_type_id} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Pilih jenis iuran...</option>
            {paymentTypes.map((pt) => {
              const isPaid = paidTypeIds.has(pt.id)
              return (
                <option key={pt.id} value={pt.id} disabled={isPaid}
                  style={isPaid ? { color: '#9ca3af' } : undefined}
                >
                  {pt.name} — Rp {pt.amount?.toLocaleString('id-ID')}{isPaid ? ' — ✓ Lunas' : ''}
                </option>
              )
            })}
          </select>
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

        {/* Jumlah bulan dibayar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah Bulan Dibayar
            <span className="text-gray-400 font-normal ml-1">(bayar beberapa bulan sekaligus)</span>
          </label>
          <input
            type="number" name="paid_months" min="1" max={maxPaidMonths}
            value={form.paid_months} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          {selectedHouse?.active_resident?.occupancy_type === 'kontrak' &&
            selectedHouse.active_resident.end_date && (
            <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Penghuni kontrak — maks. <strong className="mx-0.5">{maxPaidMonths}</strong> bulan
              (s.d. {new Date(selectedHouse.active_resident.end_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
            </p>
          )}
        </div>

        {/* Tanggal Bayar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bayar</label>
          <input
            type="date" name="payment_date" required
            value={form.payment_date} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
          <input
            type="text" name="notes"
            value={form.notes} onChange={handleChange}
            placeholder="Bayar tunai..."
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button" onClick={() => navigate('/payments')}
            className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit" disabled={loading}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
