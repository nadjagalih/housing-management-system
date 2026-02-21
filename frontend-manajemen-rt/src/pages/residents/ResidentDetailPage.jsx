import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getResident } from '../../api/residentApi'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/formatter'

export default function ResidentDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [resident, setResident] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getResident(id)
      .then((res) => setResident(res.data.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Memuat data...</div>
  if (!resident) return <div className="flex items-center justify-center h-64 text-red-400 text-sm">Data tidak ditemukan.</div>

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/residents')} className="text-gray-400 hover:text-gray-600 text-sm">← Kembali</button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{resident.full_name}</h1>
          <div className="flex gap-2 mt-2">
            <Badge status={resident.resident_type} />
            <Badge status={resident.is_active ? 'active' : 'inactive'} />
          </div>
        </div>
        <Link to={`/residents/${id}/edit`} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Edit</Link>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Informasi Penghuni</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Telepon</p>
            <p className="font-medium">{resident.phone_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Status Pernikahan</p>
            <p className="font-medium">
              {resident.marital_status === 'married' ? 'Sudah Menikah' : 'Belum Menikah'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Rumah Saat Ini</p>
            {resident.current_house ? (
              <Link to={`/houses/${resident.current_house.id}`} className="text-blue-600 hover:underline font-medium">
                Blok {resident.current_house.block} — {resident.current_house.house_number}
              </Link>
            ) : <p className="text-gray-400 italic">—</p>}
          </div>
          {resident.ktp_photo_url && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-2">Foto KTP</p>
              <img
                src={resident.ktp_photo_url}
                alt="Foto KTP"
                className="h-32 rounded-lg border object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = ''
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML += '<p class="text-xs text-red-400 italic">Foto tidak dapat dimuat</p>'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Rumah */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Riwayat Rumah</h2>
        {resident.house_history?.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada riwayat.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Rumah</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Mulai</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resident.house_history?.map((h, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <Link to={`/houses/${h.house?.id}`} className="text-blue-600 hover:underline">
                      {h.house?.house_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{formatDate(h.start_date)}</td>
                  <td className="px-3 py-2">{h.end_date ? formatDate(h.end_date) : <Badge status="active" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
