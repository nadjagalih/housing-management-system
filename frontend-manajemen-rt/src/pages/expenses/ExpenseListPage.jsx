import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteExpense, getExpenses } from '../../api/expenseApi'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useNotificationStore from '../../store/notificationStore'
import { formatDate, formatRupiah, MONTH_LABELS, EXPENSE_CATEGORIES } from '../../utils/formatter'
import { EXPENSE_CATEGORY_OPTIONS } from '../../utils/constants'

const PAGE_SIZE = 10

export default function ExpenseListPage() {
  const now = new Date()
  const [expenses, setExpenses]     = useState([])
  const [summary, setSummary]       = useState({})
  const [loading, setLoading]       = useState(true)
  const [filters, setFilters]       = useState({
    month: now.getMonth() + 1, year: now.getFullYear(), category: '',
  })
  const [deleteId, setDeleteId]     = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const { addNotification }         = useNotificationStore()

  const fetchExpenses = (params) => {
    setLoading(true)
    const p = { month: params.month, year: params.year }
    if (params.category) p.category = params.category
    getExpenses(p)
      .then((res) => {
        setExpenses(res.data.data)
        setSummary(res.data.summary)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchExpenses(filters) }, [filters])
  useEffect(() => { setPage(1) }, [filters, search])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return expenses.filter((ex) =>
      !q || ex.description?.toLowerCase().includes(q)
    )
  }, [expenses, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteExpense(deleteId)
      addNotification('Pengeluaran berhasil dihapus', 'success')
      setDeleteId(null)
      fetchExpenses(filters)
    } catch (err) {
      addNotification(err.response?.data?.message ?? 'Gagal menghapus', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Total: <span className="font-semibold text-rose-600">{formatRupiah(summary.total_pengeluaran ?? 0)}</span>
          </p>
        </div>
        <Link
          to="/expenses/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-indigo-200 transition-colors"
        >
          + Catat Pengeluaran
        </Link>
      </div>

      {/* Filters */}
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
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          <option value="">Semua Kategori</option>
          {EXPENSE_CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {/* Search deskripsi */}
        <div className="relative flex-1 min-w-45">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari deskripsi..."
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
          <EmptyState message="Belum ada pengeluaran di periode ini." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Kategori</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Deskripsi</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Nominal</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Rutin</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(ex.expense_date)}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {EXPENSE_CATEGORIES[ex.category] ?? ex.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-60 truncate">{ex.description}</td>
                    <td className="px-5 py-3.5 font-semibold text-rose-600">{formatRupiah(ex.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${ex.is_recurring ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {ex.is_recurring ? 'Ya' : 'Tidak'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link to={`/expenses/${ex.id}/edit`} className="text-gray-400 hover:text-gray-700 text-xs font-semibold mr-3">Edit</Link>
                      <button
                        onClick={() => setDeleteId(ex.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-slate-50/50">
                <p className="text-xs text-gray-500">
                  {filtered.length} data · halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…'); acc.push(n); return acc }, [])
                    .map((n, i) => n === '…' ? (
                      <span key={`e${i}`} className="px-2 text-xs text-gray-400">…</span>
                    ) : (
                      <button key={n} onClick={() => setPage(n)} className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${page === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}>{n}</button>
                    ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Hapus data pengeluaran ini?"
      />
    </div>
  )
}
