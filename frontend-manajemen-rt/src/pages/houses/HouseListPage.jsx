import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHouses } from '../../api/houseApi'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

export default function HouseListPage() {
  const [houses, setHouses]   = useState([])
  const [meta, setMeta]       = useState({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', type: '' })
  const [page, setPage]       = useState(1)
  const PAGE_SIZE             = 10

  const fetchHouses = (params = {}) => {
    setLoading(true)
    getHouses(params)
      .then((res) => {
        setHouses(res.data.data)
        setMeta(res.data.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.type)   params.type   = filters.type
    fetchHouses(params)
  }, [filters])

  useEffect(() => { setPage(1) }, [filters])

  const totalPages = Math.max(1, Math.ceil(houses.length / PAGE_SIZE))
  const paginated  = houses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rumah</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total ?? 0} total · {meta.occupied ?? 0} ditempati · {meta.empty ?? 0} kosong
          </p>
        </div>
        <Link
          to="/houses/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-indigo-200 transition-colors"
        >
          + Tambah Rumah
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          <option value="">Semua Status</option>
          <option value="occupied">Ditempati</option>
          <option value="empty">Kosong</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        >
          <option value="">Semua Tipe</option>
          <option value="permanent">Permanen</option>
          <option value="flexible">Fleksibel</option>
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
        ) : houses.length === 0 ? (
          <EmptyState message="Belum ada data rumah." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">No. Rumah</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Alamat</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tipe</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Penghuni Aktif</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((house) => (
                  <tr key={house.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {house.block}-{house.house_number}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-48 truncate">{house.address}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={house.house_type} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={house.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {house.active_resident ? (
                        <span className="font-medium">{house.active_resident.full_name}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/houses/${house.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold mr-3"
                      >
                        Detail
                      </Link>
                      <Link
                        to={`/houses/${house.id}/edit`}
                        className="text-gray-400 hover:text-gray-700 text-xs font-semibold"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-slate-50/50">
                <p className="text-xs text-gray-500">
                  {houses.length} data · halaman {page} dari {totalPages}
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
    </div>
  )
}
