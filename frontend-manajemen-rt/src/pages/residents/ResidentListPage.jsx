import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteResident, getResidents } from '../../api/residentApi'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useNotificationStore from '../../store/notificationStore'

export default function ResidentListPage() {
  const [residents, setResidents] = useState([])
  const [meta, setMeta]           = useState({})
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({ type: '', search: '' })
  const [deleteId, setDeleteId]   = useState(null)
  const [deleting, setDeleting]   = useState(false)
  const [page, setPage]           = useState(1)
  const PAGE_SIZE                 = 10
  const { addNotification }       = useNotificationStore()

  const fetchResidents = (params = {}) => {
    setLoading(true)
    getResidents(params)
      .then((res) => {
        setResidents(res.data.data)
        setMeta(res.data.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const params = {}
    if (filters.type)   params.type   = filters.type
    if (filters.search) params.search = filters.search
    const timer = setTimeout(() => fetchResidents(params), 300)
    return () => clearTimeout(timer)
  }, [filters])

  useEffect(() => { setPage(1) }, [filters])

  const totalPages = Math.max(1, Math.ceil(residents.length / PAGE_SIZE))
  const paginated  = residents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteResident(deleteId)
      addNotification('Penghuni berhasil dinonaktifkan', 'success')
      setDeleteId(null)
      fetchResidents()
    } catch (err) {
      addNotification(err.response?.data?.message ?? 'Gagal menghapus', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penghuni</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total ?? 0} total · {meta.permanent ?? 0} tetap · {meta.contract ?? 0} kontrak
          </p>
        </div>
        <Link
          to="/residents/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-indigo-200 transition-colors"
        >
          + Tambah Penghuni
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Cari nama..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          <option value="">Semua Tipe</option>
          <option value="permanent">Tetap</option>
          <option value="contract">Kontrak</option>
        </select>
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
        ) : residents.length === 0 ? (
          <EmptyState message="Belum ada data penghuni." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Nama</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">No. HP</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tipe</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status Nikah</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Rumah</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{r.full_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{r.phone_number}</td>
                    <td className="px-5 py-3.5"><Badge status={r.resident_type} /></td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {r.marital_status === 'married' ? 'Menikah' : 'Belum Menikah'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {r.current_house ? (
                        <Link to={`/houses/${r.current_house.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                          {r.current_house.house_number}
                        </Link>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={r.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link to={`/residents/${r.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold mr-3">Detail</Link>
                      <Link to={`/residents/${r.id}/edit`} className="text-gray-400 hover:text-gray-700 text-xs font-semibold mr-3">Edit</Link>
                      {r.is_active && !r.current_house && (
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                        >
                          Nonaktifkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-slate-50/50">
                <p className="text-xs text-gray-500">
                  {residents.length} data · halaman {page} dari {totalPages}
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
        message="Nonaktifkan penghuni ini? Data tetap tersimpan untuk keperluan history."
      />
    </div>
  )
}
