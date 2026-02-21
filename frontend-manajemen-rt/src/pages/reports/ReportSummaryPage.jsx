import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSummary } from '../../api/reportApi'
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart'
import { formatRupiah } from '../../utils/formatter'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportSummaryPage() {
  const [year, setYear]       = useState(new Date().getFullYear())
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSummary({ year })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [year])

  const years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const annual = data?.annual_summary

  // ── Export Excel ──────────────────────────────────────────────
  const exportExcel = () => {
    if (!data?.data) return

    const rows = data.data.map((row) => ({
      Bulan:        row.month_label,
      Pemasukan:    row.total_pemasukan,
      Pengeluaran:  row.total_pengeluaran,
      Saldo:        row.saldo,
    }))

    // Baris total
    rows.push({
      Bulan:       'TOTAL',
      Pemasukan:   annual?.total_pemasukan  ?? 0,
      Pengeluaran: annual?.total_pengeluaran ?? 0,
      Saldo:       annual?.saldo_akhir       ?? 0,
    })

    const ws = XLSX.utils.json_to_sheet(rows)

    // Lebar kolom
    ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${year}`)
    XLSX.writeFile(wb, `Laporan_Keuangan_RT_${year}.xlsx`)
  }

  // ── Export PDF ────────────────────────────────────────────────
  const exportPDF = () => {
    if (!data?.data) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Judul
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Laporan Keuangan RT', 14, 18)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`Tahun ${year}`, 14, 25)
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}`, 14, 31)

    // Ringkasan tahunan
    if (annual) {
      doc.setFontSize(9)
      doc.setTextColor(60)
      const summaryY = 39
      const cols = [
        ['Total Pemasukan', formatRupiah(annual.total_pemasukan)],
        ['Total Pengeluaran', formatRupiah(annual.total_pengeluaran)],
        ['Saldo Akhir', formatRupiah(annual.saldo_akhir)],
      ]
      cols.forEach(([label, value], i) => {
        const x = 14 + i * 62
        doc.setFont('helvetica', 'normal')
        doc.text(label, x, summaryY)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30)
        doc.text(value, x, summaryY + 6)
        doc.setTextColor(60)
      })
    }

    // Tabel bulanan
    autoTable(doc, {
      startY: 58,
      head: [['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo']],
      body: data.data.map((row) => [
        row.month_label,
        formatRupiah(row.total_pemasukan),
        formatRupiah(row.total_pengeluaran),
        formatRupiah(row.saldo),
      ]),
      foot: [[
        'TOTAL',
        formatRupiah(annual?.total_pemasukan  ?? 0),
        formatRupiah(annual?.total_pengeluaran ?? 0),
        formatRupiah(annual?.saldo_akhir       ?? 0),
      ]],
      styles:          { fontSize: 9, cellPadding: 3 },
      headStyles:      { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
      footStyles:      { fillColor: [245, 245, 245], textColor: 30, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { halign: 'left'  },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    })

    doc.save(`Laporan_Keuangan_RT_${year}.pdf`)
  }

  // ── Render ────────────────────────────────────────────────────
  const canExport = !loading && !!data?.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Tahunan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan pemasukan & pengeluaran per bulan</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Export Excel */}
          <button
            onClick={exportExcel}
            disabled={!canExport}
            title="Export ke Excel"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 shadow-sm transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m3 6V11m3 6v-4M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z"/>
            </svg>
            Excel
          </button>

          {/* Export PDF */}
          <button
            onClick={exportPDF}
            disabled={!canExport}
            title="Export ke PDF"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 shadow-sm transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6"/>
            </svg>
            PDF
          </button>

          <Link
            to="/reports/monthly"
            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 shadow-sm transition-colors font-medium"
          >
            Laporan Bulanan →
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {annual && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-sm">
            <p className="text-sm text-emerald-100">Total Pemasukan {year}</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(annual.total_pemasukan)}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-sm">
            <p className="text-sm text-rose-100">Total Pengeluaran {year}</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(annual.total_pengeluaran)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-400">Saldo Akhir {year}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900">{formatRupiah(annual.saldo_akhir)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Grafik Pemasukan vs Pengeluaran</h2>
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-gray-400 text-sm">
            <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Memuat grafik...
          </div>
        ) : (
          <IncomeExpenseChart data={data?.data} />
        )}
      </div>

      {/* Detail table */}
      {!loading && data?.data && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Bulan</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Pemasukan</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Pengeluaran</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{row.month_label}</td>
                  <td className="px-5 py-3.5 text-right text-emerald-700 font-medium">{formatRupiah(row.total_pemasukan)}</td>
                  <td className="px-5 py-3.5 text-right text-rose-600 font-medium">{formatRupiah(row.total_pengeluaran)}</td>
                  <td className={`px-5 py-3.5 text-right font-bold ${row.saldo >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatRupiah(row.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
