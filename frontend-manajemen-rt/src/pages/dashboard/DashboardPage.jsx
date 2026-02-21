import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/reportApi'
import { formatRupiah } from '../../utils/formatter'

const IconHouse = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)
const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
)
const IconCash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
)

const StatCard = ({ label, value, sub, gradient, icon }) => (
  <div className={`rounded-2xl p-5 ${gradient} text-white shadow-sm`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium opacity-80">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-1.5">{sub}</p>}
      </div>
      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
)

export default function DashboardPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError('Gagal memuat data dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-rose-500 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const { houses, residents, current_month } = data
  const saldoPositive = (current_month?.saldo ?? 0) >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan data — {current_month?.month_label}</p>
        </div>
        <Link
          to="/reports/summary"
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors shadow-sm"
        >
          <IconChart /> Lihat Laporan
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Rumah"
          value={houses?.total ?? 0}
          sub={`${houses?.occupied ?? 0} ditempati · ${houses?.empty ?? 0} kosong`}
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
          icon={<IconHouse />}
        />
        <StatCard
          label="Total Penghuni"
          value={residents?.total ?? 0}
          sub={`${residents?.permanent ?? 0} tetap · ${residents?.contract ?? 0} kontrak`}
          gradient="bg-gradient-to-br from-violet-500 to-indigo-600"
          icon={<IconUsers />}
        />
        <StatCard
          label="Tagihan Lunas"
          value={current_month?.tagihan_lunas ?? 0}
          sub="bulan ini"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon={<IconCheckCircle />}
        />
        <StatCard
          label="Belum Lunas"
          value={current_month?.tagihan_belum_lunas ?? 0}
          sub="bulan ini"
          gradient="bg-gradient-to-br from-rose-500 to-red-600"
          icon={<IconClock />}
        />
      </div>

      {/* Keuangan bulan ini */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">
            Keuangan Bulan Ini
          </h2>
          <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
            {current_month?.month_label}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <p className="text-xs font-medium text-emerald-700">Pemasukan</p>
            </div>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {formatRupiah(current_month?.pemasukan ?? 0)}
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              <p className="text-xs font-medium text-rose-700">Pengeluaran</p>
            </div>
            <p className="text-xl font-bold text-rose-700 mt-1">
              {formatRupiah(current_month?.pengeluaran ?? 0)}
            </p>
          </div>
          <div className={`${saldoPositive ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${saldoPositive ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
              <p className={`text-xs font-medium ${saldoPositive ? 'text-indigo-700' : 'text-orange-700'}`}>Saldo</p>
            </div>
            <p className={`text-xl font-bold mt-1 ${saldoPositive ? 'text-indigo-700' : 'text-orange-700'}`}>
              {formatRupiah(current_month?.saldo ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Akses Cepat</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Kelola Rumah',    path: '/houses',          icon: <IconHouse />,       color: 'hover:border-sky-300 hover:bg-sky-50',      iconColor: 'text-sky-500' },
            { label: 'Kelola Penghuni', path: '/residents',       icon: <IconUsers />,       color: 'hover:border-violet-300 hover:bg-violet-50', iconColor: 'text-violet-500' },
            { label: 'Pembayaran',      path: '/payments',        icon: <IconCash />,        color: 'hover:border-emerald-300 hover:bg-emerald-50',iconColor: 'text-emerald-500' },
            { label: 'Laporan Tahunan', path: '/reports/summary', icon: <IconChart />,       color: 'hover:border-indigo-300 hover:bg-indigo-50', iconColor: 'text-indigo-500' },
          ].map(({ label, path, icon, color, iconColor }) => (
            <Link
              key={path}
              to={path}
              className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm transition-all flex flex-col items-center gap-2.5 ${color}`}
            >
              <span className={`w-7 h-7 ${iconColor}`}>{icon}</span>
              <span className="text-sm font-medium text-gray-700 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
