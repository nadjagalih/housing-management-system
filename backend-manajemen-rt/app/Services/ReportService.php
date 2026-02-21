<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;
use Carbon\Carbon;

class ReportService
{
    /**
     * Statistik ringkasan untuk dashboard.
     */
    public function getDashboard(): array
    {
        $now   = Carbon::now();
        $month = $now->month;
        $year  = $now->year;

        $totalHouses   = House::count();
        $occupiedCount = House::where('status', 'occupied')->count();
        $emptyCount    = $totalHouses - $occupiedCount;

        $totalResidents    = Resident::where('is_active', true)->count();
        $permanentResidents = Resident::where('is_active', true)->where('resident_type', 'permanent')->count();
        $contractResidents  = $totalResidents - $permanentResidents;

        $payments = Payment::where('month', $month)->where('year', $year)->get();

        $pemasukan   = $payments->where('status', 'paid')->sum('amount');
        $pengeluaran = Expense::where('month', $month)->where('year', $year)->sum('amount');
        $lunas       = $payments->where('status', 'paid')->count();
        $belumLunas  = $payments->where('status', 'unpaid')->count();

        $monthLabel = Carbon::create($year, $month)->locale('id')->isoFormat('MMMM YYYY');

        return [
            'houses' => [
                'total'    => $totalHouses,
                'occupied' => $occupiedCount,
                'empty'    => $emptyCount,
            ],
            'residents' => [
                'total'     => $totalResidents,
                'permanent' => $permanentResidents,
                'contract'  => $contractResidents,
            ],
            'current_month' => [
                'month_label'         => $monthLabel,
                'pemasukan'           => (int) $pemasukan,
                'pengeluaran'         => (int) $pengeluaran,
                'saldo'               => (int) ($pemasukan - $pengeluaran),
                'tagihan_lunas'       => $lunas,
                'tagihan_belum_lunas' => $belumLunas,
            ],
        ];
    }

    /**
     * Grafik 12 bulan pemasukan & pengeluaran untuk satu tahun.
     */
    public function getMonthlySummary(int $year): array
    {
        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $payments = Payment::where('year', $year)->where('status', 'paid')
            ->selectRaw('month, SUM(amount) as total')
            ->groupBy('month')
            ->pluck('total', 'month');

        $expenses = Expense::where('year', $year)
            ->selectRaw('month, SUM(amount) as total')
            ->groupBy('month')
            ->pluck('total', 'month');

        $data             = [];
        $totalPemasukan   = 0;
        $totalPengeluaran = 0;

        for ($m = 1; $m <= 12; $m++) {
            $p  = (int) ($payments[$m] ?? 0);
            $e  = (int) ($expenses[$m] ?? 0);
            $totalPemasukan   += $p;
            $totalPengeluaran += $e;

            $data[] = [
                'month'             => $m,
                'month_label'       => $monthNames[$m],
                'total_pemasukan'   => $p,
                'total_pengeluaran' => $e,
                'saldo'             => $p - $e,
            ];
        }

        return [
            'year' => $year,
            'data' => $data,
            'annual_summary' => [
                'total_pemasukan'   => $totalPemasukan,
                'total_pengeluaran' => $totalPengeluaran,
                'saldo_akhir'       => $totalPemasukan - $totalPengeluaran,
            ],
        ];
    }

    /**
     * Detail transaksi (pemasukan + pengeluaran) untuk satu bulan.
     */
    public function getMonthlyDetail(int $month, int $year): array
    {
        $monthNames = [
            1=>'Januari',2=>'Februari',3=>'Maret',4=>'April',5=>'Mei',6=>'Juni',
            7=>'Juli',8=>'Agustus',9=>'September',10=>'Oktober',11=>'November',12=>'Desember',
        ];

        $payments = Payment::with(['house', 'resident', 'paymentType'])
            ->where('month', $month)
            ->where('year', $year)
            ->where('status', 'paid')
            ->get();

        $expenses = Expense::where('month', $month)->where('year', $year)->get();

        $totalPemasukan   = $payments->sum('amount');
        $totalPengeluaran = $expenses->sum('amount');

        return [
            'month'       => $month,
            'year'        => $year,
            'month_label' => $monthNames[$month] . ' ' . $year,
            'pemasukan'   => [
                'total' => (int) $totalPemasukan,
                'items' => $payments->map(fn($p) => [
                    'house'    => $p->house?->house_number,
                    'resident' => $p->resident?->full_name,
                    'type'     => $p->paymentType?->name,
                    'amount'   => (int) $p->amount,
                    'status'   => $p->status,
                ])->values(),
            ],
            'pengeluaran' => [
                'total' => (int) $totalPengeluaran,
                'items' => $expenses->map(fn($e) => [
                    'category'    => $e->category,
                    'description' => $e->description,
                    'amount'      => (int) $e->amount,
                ])->values(),
            ],
            'saldo' => (int) ($totalPemasukan - $totalPengeluaran),
        ];
    }

    /**
     * List tunggakan per penghuni untuk bulan/tahun tertentu.
     */
    public function getUnpaid(int $month, int $year): array
    {
        $unpaidPayments = Payment::with(['house', 'resident', 'paymentType'])
            ->where('month', $month)
            ->where('year', $year)
            ->where('status', 'unpaid')
            ->get()
            ->groupBy('house_id');

        $data           = [];
        $totalTunggakan = 0;

        foreach ($unpaidPayments as $houseId => $payments) {
            $firstPayment  = $payments->first();
            $totalPerHouse = $payments->sum('amount');
            $totalTunggakan += $totalPerHouse;

            $data[] = [
                'house'    => [
                    'house_number' => $firstPayment->house?->house_number,
                ],
                'resident' => [
                    'full_name'    => $firstPayment->resident?->full_name,
                    'phone_number' => $firstPayment->resident?->phone_number,
                ],
                'unpaid' => $payments->map(fn($p) => [
                    'type'   => $p->paymentType?->name,
                    'amount' => (int) $p->amount,
                ])->values(),
                'total_tunggakan' => (int) $totalPerHouse,
            ];
        }

        return [
            'data'            => $data,
            'total_tunggakan' => (int) $totalTunggakan,
        ];
    }
}
