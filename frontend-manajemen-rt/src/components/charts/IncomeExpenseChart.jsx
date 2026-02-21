import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatRupiah } from '../../utils/formatter'

const formatYAxis = (val) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}rb`
  return val
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function IncomeExpenseChart({ data }) {
  if (!data?.length) return null

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month_label" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="total_pemasukan" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="total_pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
