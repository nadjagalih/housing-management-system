import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { assignResident, getHouse, unassignResident } from '../../api/houseApi'
import { getResidents } from '../../api/residentApi'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useNotificationStore from '../../store/notificationStore'
import { formatDate, formatRupiah } from '../../utils/formatter'

export default function HouseDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { addNotification } = useNotificationStore()

  const [house, setHouse]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [unassignOpen, setUnassignOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Assign form
  const [residents, setResidents]   = useState([])
  const [assignForm, setAssignForm] = useState({
    resident_id: '', start_date: '', contract_duration: '', notes: '',
  })
  const [selectedResident, setSelectedResident] = useState(null)
  const [unassignForm, setUnassignForm] = useState({ end_date: '', notes: '' })

  const handleResidentChange = (residentId) => {
    const resident = residents.find((r) => r.id === parseInt(residentId))
    setSelectedResident(resident || null)
    setAssignForm((f) => ({
      ...f,
      resident_id:       residentId,
      contract_duration: '',
    }))
  }

  const isKontrak = selectedResident?.resident_type === 'kontrak'

  const fetchHouse = () => {
    setLoading(true)
    getHouse(id)
      .then((res) => setHouse(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchHouse()
    getResidents().then((res) => setResidents(res.data.data))
  }, [id])

  const handleAssign = async () => {
    if (!assignForm.resident_id || !assignForm.start_date) {
      addNotification('Penghuni dan tanggal mulai wajib diisi.', 'error')
      return
    }
    if (isKontrak && !assignForm.contract_duration) {
      addNotification('Durasi kontrak wajib diisi untuk penghuni bertipe kontrak.', 'error')
      return
    }
    setActionLoading(true)
    try {
      await assignResident(id, {
        resident_id:       Number(assignForm.resident_id),
        start_date:        assignForm.start_date,
        contract_duration: isKontrak ? Number(assignForm.contract_duration) : null,
        notes:             assignForm.notes || null,
      })
      addNotification('Penghuni berhasil di-assign', 'success')
      setAssignOpen(false)
      setSelectedResident(null)
      fetchHouse()
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors
        ? Object.values(errors).flat().join(', ')
        : err.response?.data?.message ?? 'Gagal assign penghuni'
      addNotification(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnassign = async () => {
    setActionLoading(true)
    try {
      await unassignResident(id, unassignForm)
      addNotification('Penghuni berhasil dilepas', 'success')
      setUnassignOpen(false)
      fetchHouse()
    } catch (err) {
      addNotification(err.response?.data?.message ?? 'Gagal melepas penghuni', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Memuat data...</div>
  if (!house)  return <div className="flex items-center justify-center h-64 text-red-400 text-sm">Data tidak ditemukan.</div>

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/houses')} className="text-gray-400 hover:text-gray-600 text-sm">← Kembali</button>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {house.block ? `Blok ${house.block} — ` : ''}{house.house_number}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {house.block && <span>Blok {house.block} · </span>}
            {house.address}
          </p>
          <div className="flex gap-2 mt-2">
            <Badge status={house.status} />
            <Badge status={house.house_type} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/houses/${id}/edit`} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Edit</Link>
          {house.status === 'empty' ? (
            <button
              onClick={() => setAssignOpen(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Daftarkan Penghuni
            </button>
          ) : (
            <button
              onClick={() => setUnassignOpen(true)}
              className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
            >
              Lepas Penghuni
            </button>
          )}
        </div>
      </div>

      {/* Penghuni Aktif */}
      {house.active_resident && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Penghuni Aktif</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Nama</span><p className="font-medium">{house.active_resident.full_name}</p></div>
            <div><span className="text-gray-400">Telepon</span><p className="font-medium">{house.active_resident.phone_number}</p></div>
            <div><span className="text-gray-400">Tipe</span><p><Badge status={house.active_resident.resident_type} /></p></div>
          </div>
        </div>
      )}

      {/* Riwayat Penghuni */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Riwayat Penghuni</h2>
        {house.resident_history?.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada riwayat.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Nama</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Mulai</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Selesai</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {house.resident_history?.map((h, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{h.resident?.full_name}</td>
                  <td className="px-3 py-2">{formatDate(h.start_date)}</td>
                  <td className="px-3 py-2">{h.end_date ? formatDate(h.end_date) : '—'}</td>
                  <td className="px-3 py-2"><Badge status={h.is_active ? 'active' : 'inactive'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Riwayat Pembayaran */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Riwayat Pembayaran</h2>
        {house.payment_history?.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada riwayat pembayaran.</p>
        ) : (
          <div className="space-y-3">
            {house.payment_history?.map((ph, i) => (
              <div key={i} className="border rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  {ph.month}/{ph.year} — {ph.resident?.full_name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ph.payments?.map((p, j) => (
                    <span key={j} className="flex items-center gap-1 text-xs">
                      <Badge status={p.status} />
                      <span className="text-gray-600">{p.type} · {formatRupiah(p.amount)}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Assign */}
      <Modal isOpen={assignOpen} onClose={() => { setAssignOpen(false); setSelectedResident(null) }} title="Assign Penghuni">
        <div className="space-y-4">

          {/* Dropdown Penghuni */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penghuni *</label>
            {residents.filter((r) => !r.current_house).length === 0 ? (
              <p className="text-sm text-gray-400 border rounded-lg px-3 py-2.5 bg-gray-50">
                Semua penghuni sudah memiliki hunian aktif.
              </p>
            ) : (
              <select
                value={assignForm.resident_id}
                onChange={(e) => handleResidentChange(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
              >
                <option value="">Pilih penghuni...</option>
                {residents
                  .filter((r) => !r.current_house)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} — {r.resident_type === 'kontrak' ? 'Kontrak' : 'Tetap'}
                    </option>
                  ))}
              </select>
            )}
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
                onChange={(e) => setAssignForm((f) => ({ ...f, contract_duration: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Contoh: 6"
                required
              />
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
              onChange={(e) => setAssignForm((f) => ({ ...f, start_date: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              required
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <textarea
              value={assignForm.notes}
              onChange={(e) => setAssignForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              rows={2}
              placeholder="Kosongkan jika tidak ada"
            />
          </div>

          {/* Tombol */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setAssignOpen(false); setSelectedResident(null) }}
              className="px-4 py-2 text-sm border rounded-lg"
            >Batal</button>
            <button
              onClick={handleAssign}
              disabled={actionLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {actionLoading ? 'Menyimpan...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Unassign */}
      <Modal isOpen={unassignOpen} onClose={() => setUnassignOpen(false)} title="Lepas Penghuni" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Keluar</label>
            <input
              type="date"
              value={unassignForm.end_date}
              onChange={(e) => setUnassignForm((f) => ({ ...f, end_date: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <input
              type="text"
              value={unassignForm.notes}
              onChange={(e) => setUnassignForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setUnassignOpen(false)} className="px-4 py-2 text-sm border rounded-lg">Batal</button>
            <button onClick={handleUnassign} disabled={actionLoading} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50">
              {actionLoading ? 'Memproses...' : 'Lepas Penghuni'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
