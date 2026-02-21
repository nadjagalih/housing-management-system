import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMonthlyDetail, getUnpaid } from '../../api/reportApi'
import Badge from '../../components/ui/Badge'
import { formatRupiah, MONTH_LABELS, EXPENSE_CATEGORIES } from '../../utils/formatter'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportMonthlyPage() {
  const now = new Date()
  const [filters, setFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [detail, setDetail]   = useState(null)
  const [unpaid, setUnpaid]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('detail')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getMonthlyDetail({ month: filters.month, year: filters.year }),
      getUnpaid({ month: filters.month, year: filters.year }),
    ])
      .then(([detailRes, unpaidRes]) => {
        setDetail(detailRes.data)
        setUnpaid(unpaidRes.data)
      })
      .finally(() => setLoading(false))
  }, [filters])

  const years      = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
  const saldo      = detail?.saldo ?? 0
  const saldoColor = saldo >= 0 ? 'text-gray-900' : 'text-red-600'
  const canExport  = !loading && !!detail
  const monthLabel = detail?.month_label ?? `${filters.month}-${filters.year}`
  const fileSlug   = `Laporan_Bulanan_${filters.month}_${filters.year}`

  const selectCls = 'border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all'

  // ── Export Excel ────────────────────────────────────────────
  const exportExcel = () => {
    if (!detail) return
    const wb = XLSX.utils.book_new()

    // Sheet 1 — Pemasukan
    const incomeRows = (detail.pemasukan?.items ?? []).map((item) => ({
      Rumah:    item.house,
      Penghuni: item.resident,
      Jenis:    item.type,
      Nominal:  item.amount,
      Status:   item.status === 'paid' ? 'Lunas' : 'Belum Lunas',
    }))
    incomeRows.push({ Rumah: 'TOTAL', Penghuni: '', Jenis: '', Nominal: detail.pemasukan?.total ?? 0, Status: '' })
    const ws1 = XLSX.utils.json_to_sheet(incomeRows)
    ws1['!cols'] = [{ wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Pemasukan')

    // Sheet 2 — Pengeluaran
    const expenseRows = (detail.pengeluaran?.items ?? []).map((item) => ({
      Kategori:   EXPENSE_CATEGORIES[item.category] ?? item.category,
      Deskripsi:  item.description,
      Nominal:    item.amount,
    }))
    expenseRows.push({ Kategori: 'TOTAL', Deskripsi: '', Nominal: detail.pengeluaran?.total ?? 0 })
    const ws2 = XLSX.utils.json_to_sheet(expenseRows)
    ws2['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Pengeluaran')

    // Sheet 3 — Tunggakan
    if (unpaid?.data?.length > 0) {
      const unpaidRows = unpaid.data.map((row) => ({
        Rumah:          row.house?.house_number,
        Penghuni:       row.resident?.full_name,
        'No. HP':       row.resident?.phone_number,
        'Jenis Tunggakan': row.unpaid?.map((u) => u.type).join(', '),
        Total:          row.total_tunggakan,
      }))
      const ws3 = XLSX.utils.json_to_sheet(unpaidRows)
      ws3['!cols'] = [{ wch: 10 }, { wch: 22 }, { wch: 16 }, { wch: 24 }, { wch: 16 }]
      XLSX.utils.book_append_sheet(wb, ws3, 'Tunggakan')
    }

    XLSX.writeFile(wb, `${fileSlug}.xlsx`)
  }

  // ── Export PDF ──────────────────────────────────────────────
  const exportPDF = () => {
    if (!detail) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

    // Judul
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Laporan Keuangan Bulanan', 14, 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(monthLabel, 14, 25)
    doc.text(`Dicetak: ${printDate}`, 14, 31)

    // Ringkasan
    doc.setFontSize(9)
    const summaryItems = [
      ['Pemasukan',   formatRupiah(detail.pemasukan?.total ?? 0)],
      ['Pengeluaran', formatRupiah(detail.pengeluaran?.total ?? 0)],
      ['Saldo',       formatRupiah(saldo)],
    ]
    summaryItems.forEach(([label, value], i) => {
      const x = 14 + i * 62
      doc.setTextColor(120)
      doc.setFont('helvetica', 'normal')
      doc.text(label, x, 40)
      doc.setTextColor(30)
      doc.setFont('helvetica', 'bold')
      doc.text(value, x, 46)
    })

    // Tabel Pemasukan
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30)
    doc.text('Pemasukan', 14, 57)

    autoTable(doc, {
      startY: 60,
      head: [['Rumah', 'Penghuni', 'Jenis', 'Nominal', 'Status']],
      body: (detail.pemasukan?.items ?? []).map((item) => [
        item.house,
        item.resident,
        item.type,
        formatRupiah(item.amount),
        item.status === 'paid' ? 'Lunas' : 'Belum Lunas',
      ]),
      foot: [['', '', 'TOTAL', formatRupiah(detail.pemasukan?.total ?? 0), '']],
      styles:             { fontSize: 8, cellPadding: 2.5 },
      headStyles:         { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
      footStyles:         { fillColor: [245, 245, 245], textColor: 30, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' },
      },
    })

    // Tabel Pengeluaran
    const afterIncome = doc.lastAutoTable?.finalY ?? 100
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30)
    doc.text('Pengeluaran', 14, afterIncome + 10)

    autoTable(doc, {
      startY: afterIncome + 13,
      head: [['Kategori', 'Deskripsi', 'Nominal']],
      body: (detail.pengeluaran?.items ?? []).map((item) => [
        EXPENSE_CATEGORIES[item.category] ?? item.category,
        item.description,
        formatRupiah(item.amount),
      ]),
      foot: [['', 'TOTAL', formatRupiah(detail.pengeluaran?.total ?? 0)]],
      styles:             { fontSize: 8, cellPadding: 2.5 },
      headStyles:         { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
      footStyles:         { fillColor: [245, 245, 245], textColor: 30, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: { 2: { halign: 'right' } },
    })

    doc.save(`${fileSlug}.pdf`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Laporan Bulanan</h1>
          <p className="text-sm text-gray-400 mt-0.5">{detail?.month_label ?? '—'}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))} className={selectCls}>
            {MONTH_LABELS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))} className={selectCls}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Export Excel */}
          <button
            onClick={exportExcel}
            disabled={!canExport}
            title="Export ke Excel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6"/>
            </svg>
            PDF
          </button>

          <Link
            to="/reports/summary"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Laporan Tahunan
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Memuat data...</div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pemasukan',   value: detail?.pemasukan?.total ?? 0,  color: 'text-gray-900' },
              { label: 'Pengeluaran', value: detail?.pengeluaran?.total ?? 0, color: 'text-gray-900' },
              { label: 'Saldo',       value: saldo,                           color: saldoColor },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                <p className={`text-lg font-semibold ${color}`}>{formatRupiah(value)}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="border-b border-gray-200 flex gap-0">
            {['detail', 'unpaid'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === t
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'detail' ? 'Detail Transaksi' : `Tunggakan (${unpaid?.data?.length ?? 0})`}
              </button>
            ))}
          </div>

          {/* ── Tab: Detail ── */}
          {tab === 'detail' && (
            <div className="space-y-5">

              {/* Pemasukan */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Pemasukan</span>
                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(detail?.pemasukan?.total ?? 0)}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Rumah</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Penghuni</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Jenis</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Nominal</th>
                      <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detail?.pemasukan?.items?.length > 0 ? detail.pemasukan.items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{item.house}</td>
                        <td className="px-5 py-3 text-gray-500">{item.resident}</td>
                        <td className="px-5 py-3 capitalize text-gray-500">{item.type}</td>
                        <td className="px-5 py-3 text-right text-gray-800">{formatRupiah(item.amount)}</td>
                        <td className="px-5 py-3 text-center"><Badge status={item.status} /></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                          Tidak ada data pemasukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pengeluaran */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Pengeluaran</span>
                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(detail?.pengeluaran?.total ?? 0)}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Kategori</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Deskripsi</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detail?.pengeluaran?.items?.length > 0 ? detail.pengeluaran.items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="inline-block border border-gray-200 text-gray-500 px-2 py-0.5 rounded text-xs">
                            {EXPENSE_CATEGORIES[item.category] ?? item.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{item.description}</td>
                        <td className="px-5 py-3 text-right text-gray-800 font-medium">{formatRupiah(item.amount)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">
                          Tidak ada data pengeluaran
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: Tunggakan ── */}
          {tab === 'unpaid' && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Tunggakan</span>
                <span className="text-sm font-semibold text-gray-900">{formatRupiah(unpaid?.total_tunggakan ?? 0)}</span>
              </div>
              {unpaid?.data?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 gap-2 text-gray-400 text-sm">
                  <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tidak ada tunggakan bulan ini
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Rumah</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Penghuni</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">No. HP</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Jenis Tunggakan</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {unpaid?.data?.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{row.house?.house_number}</td>
                        <td className="px-5 py-3 text-gray-600">{row.resident?.full_name}</td>
                        <td className="px-5 py-3 text-gray-400">{row.resident?.phone_number}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.unpaid?.map((u, j) => (
                              <span key={j} className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded capitalize">
                                {u.type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800">
                          {formatRupiah(row.total_tunggakan)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
