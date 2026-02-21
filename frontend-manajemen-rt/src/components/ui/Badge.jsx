const config = {
  paid:      { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500', label: 'Lunas' },
  unpaid:    { bg: 'bg-rose-50 text-rose-700 border-rose-200',           dot: 'bg-rose-500',    label: 'Belum Lunas' },
  occupied:  { bg: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500',     label: 'Ditempati' },
  empty:     { bg: 'bg-gray-50 text-gray-500 border-gray-200',          dot: 'bg-gray-400',    label: 'Kosong' },
  tetap:     { bg: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    label: 'Tetap' },
  kontrak:   { bg: 'bg-orange-50 text-orange-700 border-orange-200',    dot: 'bg-orange-500',  label: 'Kontrak' },
  active:    { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Aktif' },
  inactive:  { bg: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500',    label: 'Nonaktif' },
  flexible:  { bg: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   label: 'Fleksibel' },
}

export default function Badge({ status }) {
  const c = config[status]
  if (!c) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
      {status}
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`}></span>
      {c.label}
    </span>
  )
}
