<?php

namespace Database\Seeders;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    /**
     * Seeder pengeluaran tahun 2025.
     *
     * Pengeluaran rutin bulanan:
     *   - Gaji satpam          : Rp 1.500.000 / bulan (Januari – Desember)
     *   - Upah petugas kebersihan : Rp 600.000 / bulan (Januari – Desember)
     *
     * Pengeluaran tidak rutin:
     *   - Perbaikan pos kampling        : Rp 2.000.000  (Juli 2025)
     *   - Pemasangan lampu & hiasan Idul Fitri : Rp 3.500.000 (Maret 2025)
     */
    public function run(): void
    {
        $expenses = [];

        // ----------------------------------------------------------
        // 1. Gaji Satpam — rutin tiap bulan
        // ----------------------------------------------------------
        foreach (range(1, 12) as $month) {
            $expenses[] = [
                'category'     => 'gaji_satpam',
                'description'  => 'Gaji Satpam ' . $this->monthName($month) . ' 2025',
                'amount'       => 1_500_000,
                'expense_date' => Carbon::create(2025, $month, 1)->toDateString(),
                'month'        => $month,
                'year'         => 2025,
                'is_recurring' => true,
                'receipt_photo'=> null,
                'notes'        => 'Pembayaran gaji satpam rutin bulan ' . $this->monthName($month) . ' 2025',
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        // ----------------------------------------------------------
        // 2. Upah Petugas Kebersihan — rutin tiap bulan
        // ----------------------------------------------------------
        foreach (range(1, 12) as $month) {
            $expenses[] = [
                'category'     => 'other',
                'description'  => 'Upah Petugas Kebersihan ' . $this->monthName($month) . ' 2025',
                'amount'       => 600_000,
                'expense_date' => Carbon::create(2025, $month, 5)->toDateString(),
                'month'        => $month,
                'year'         => 2025,
                'is_recurring' => true,
                'receipt_photo'=> null,
                'notes'        => 'Upah petugas kebersihan lingkungan rutin bulan ' . $this->monthName($month) . ' 2025',
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        // ----------------------------------------------------------
        // 3. Perbaikan Pos Kampling — satu kali, Juli 2025
        // ----------------------------------------------------------
        $expenses[] = [
            'category'     => 'other',
            'description'  => 'Perbaikan Pos Kampling',
            'amount'       => 2_000_000,
            'expense_date' => Carbon::create(2025, 7, 15)->toDateString(),
            'month'        => 7,
            'year'         => 2025,
            'is_recurring' => false,
            'receipt_photo'=> null,
            'notes'        => 'Biaya perbaikan dan renovasi pos kampling RT',
            'created_at'   => now(),
            'updated_at'   => now(),
        ];

        // ----------------------------------------------------------
        // 4. Pemasangan Lampu & Hiasan Hari Raya Idul Fitri — Maret 2025
        //    (Idul Fitri 1446 H jatuh pada 30–31 Maret 2025)
        // ----------------------------------------------------------
        $expenses[] = [
            'category'     => 'other',
            'description'  => 'Pemasangan Lampu dan Hiasan Hari Raya Idul Fitri 1446 H',
            'amount'       => 3_500_000,
            'expense_date' => Carbon::create(2025, 3, 20)->toDateString(),
            'month'        => 3,
            'year'         => 2025,
            'is_recurring' => false,
            'receipt_photo'=> null,
            'notes'        => 'Pembelian dan pemasangan lampu hias serta dekorasi Idul Fitri 1446 H di lingkungan RT',
            'created_at'   => now(),
            'updated_at'   => now(),
        ];

        Expense::insert($expenses);

        $total = array_sum(array_column($expenses, 'amount'));
        $this->command->info('ExpenseSeeder: ' . count($expenses) . ' data pengeluaran berhasil disimpan.');
        $this->command->info('Total pengeluaran 2025: Rp ' . number_format($total, 0, ',', '.'));
    }

    private function monthName(int $month): string
    {
        $names = [
            1  => 'Januari',   2  => 'Februari', 3  => 'Maret',
            4  => 'April',     5  => 'Mei',       6  => 'Juni',
            7  => 'Juli',      8  => 'Agustus',   9  => 'September',
            10 => 'Oktober',   11 => 'November',  12 => 'Desember',
        ];

        return $names[$month] ?? (string) $month;
    }
}
