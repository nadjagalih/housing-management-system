import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deletePayment, generateMonthly, getPayments, getPaymentTypes, markPaid } from '../../api/paymentApi'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useNotificationStore from '../../store/notificationStore'
import { formatRupiah, MONTH_LABELS } from '../../utils/formatter'

const PAGE_SIZE = 10

export default function PaymentListPage() {
  const now = new Date()
  const [payments, setPayments]     = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [summary, setSummary]       = useState({})
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filters, setFilters]       = useState({
    month: now.getMonth() + 1, year: now.getFullYear(), status: '',
  })
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage]             = useState(1)
  const [markId, setMarkId]         = useState(null)
  const [deleteId, setDeleteId]     = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { addNotification }         = useNotificationStore()

  const fetchPayments = (params) => {
    setLoading(true)
    const p = { month: params.month, year: params.year }
    if (params.status) p.status = params.status
    getPayments(p)
      .then((res) => {
        setPayments(res.data.data)
        setSummary(res.data.summary)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayments(filters) }, [filters])
  useEffect(() => { getPaymentTypes().then((res) => setPaymentTypes(res.data.data ?? [])) }, [])

  // Reset page whenever any filter/search changes
  useEffect(() => { setPage(1) }, [filters, search, typeFilter])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await generateMonthly({ month: filters.month, year: filters.year })
      addNotification(res.data.message, 'success')
      fetchPayments(filters)
    } catch (err) {
      addNotification(err.response?.data?.message ?? 'Gagal generate tagihan', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkPaid = async () => {
    setActionLoading(true)
    try {
      await markPaid(markId, { payment_date: new Date().toISOString().slice(0, 10) })
      addNotification('Tagihan berhasil ditandai lunas', 'success')
      setMarkId(null)
      fetchPayments(filters)
    } catch (err) {
      addNotification(err.response?.data?.message ?? 'Gagal menandai lunas', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deletePayment(deleteId)
      addNotification('Tagihan berhasil dihapus', 'success')
      setDeleteId(null)
      fetchPayments(filters)
    } catch (err) {
      addNotification(err.response?.data?.message ?? 'Gagal menghapus tagihan', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  // Client-side filter: search + type
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return payments.filter((p) => {
      const matchSearch = !q
        || p.house?.house_number?.toLowerCase().includes(q)
        || p.resident?.full_name?.toLowerCase().includes(q)
      const matchType = !typeFilter || String(p.payment_type_id) === typeFilter
      return matchSearch && matchType
    })
  }, [payments, search, typeFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {summary.total_tagihan ?? 0} tagihan · {summary.lunas ?? 0} lunas · {summary.belum_lunas ?? 0} belum lunas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-sm shadow-emerald-200 transition-colors"
          >
            {generating ? 'Generating...' : '⚡ Generate Tagihan'}
          </button>
          <Link
            to="/payments/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-indigo-200 transition-colors"
          >
            + Input Manual
          </Link>
        </div>
      </div>

      {/* Filters row 1: periode + status */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filters.month}
          onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          {MONTH_LABELS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          <option value="">Semua Status</option>
          <option value="paid">Lunas</option>
          <option value="unpaid">Belum Lunas</option>
        </select>
        {/* Filter jenis tagihan */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          <option value="">Semua Jenis</option>
          {paymentTypes.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.name}</option>
          ))}
        </select>
        {/* Search */}
        <div className="relative flex-1 min-w-45">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari rumah atau penghuni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-gray-400 text-sm">
            <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Memuat data...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Belum ada data tagihan untuk periode ini."/>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Rumah</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Penghuni</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Jenis Iuran</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Nominal</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Periode</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-900">{p.house?.house_number ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{p.resident?.full_name ?? '—'}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-600">{p.payment_type?.name}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{formatRupiah(p.payment_type?.amount ?? 0)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{MONTH_LABELS[p.month - 1]} {p.year}</td>
                    <td className="px-5 py-3.5"><Badge status={p.status} /></td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {p.status === 'unpaid' && (
                        <>
                          <button
                            onClick={() => setMarkId(p.id)}
                            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold mr-3"
                          >
                            Tandai Lunas
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                      {p.status === 'paid' && p.payment_date && (
                        <span className="text-xs text-gray-400">{p.payment_date}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-slate-50/50">
                <p className="text-xs text-gray-500">
                  {filtered.length} data · halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, idx, arr) => {
                      if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                      acc.push(n)
                      return acc
                    }, [])
                    .map((n, i) =>
                      n === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                            page === n
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {n}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(markId)}
        onClose={() => setMarkId(null)}
        onConfirm={handleMarkPaid}
        loading={actionLoading}
        message="Tandai tagihan ini sebagai lunas?"
      />
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        message="Hapus tagihan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  )
}
