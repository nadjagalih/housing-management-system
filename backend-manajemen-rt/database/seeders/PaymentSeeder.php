<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use App\Models\PaymentType;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Seeder pemasukan tahun 2025.
     *
     * - Semua jenis iuran (satpam & kebersihan)
     * - Dari 15 rumah dengan penghuni tetap (blok A & B)
     * - Seluruh 12 bulan (Januari – Desember 2025)
     * - Semua berstatus lunas (paid)
     */
    public function run(): void
    {
        // Ambil semua jenis iuran aktif
        $paymentTypes = PaymentType::where('is_active', true)->get();

        // Ambil 15 rumah tetap yang sudah berpenghuni
        $tetapHouses = House::where('house_type', 'tetap')
            ->where('status', 'occupied')
            ->get();

        $payments = [];

        foreach ($tetapHouses as $house) {
            // Ambil penghuni aktif di rumah tersebut
            $houseResident = HouseResident::where('house_id', $house->id)
                ->where('is_active', true)
                ->where('occupancy_type', 'tetap')
                ->first();

            if (! $houseResident) {
                continue;
            }

            $residentId = $houseResident->resident_id;

            foreach (range(1, 12) as $month) {
                foreach ($paymentTypes as $type) {
                    // Tanggal bayar = tanggal 10 bulan tersebut
                    $paymentDate = Carbon::create(2025, $month, 10)->toDateString();
                    // Jatuh tempo = akhir bulan
                    $dueDate = Carbon::create(2025, $month, 1)
                        ->endOfMonth()
                        ->toDateString();

                    $payments[] = [
                        'house_id'        => $house->id,
                        'resident_id'     => $residentId,
                        'payment_type_id' => $type->id,
                        'month'           => $month,
                        'year'            => 2025,
                        'amount'          => $type->amount,
                        'status'          => 'paid',
                        'payment_date'    => $paymentDate,
                        'due_date'        => $dueDate,
                        'notes'           => 'Lunas – ' . $type->name . ' bulan ' . $this->monthName($month) . ' 2025',
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ];
                }
            }
        }

        // Simpan dalam batch agar lebih efisien
        foreach (array_chunk($payments, 200) as $chunk) {
            Payment::insert($chunk);
        }

        $this->command->info('PaymentSeeder: ' . count($payments) . ' data pembayaran berhasil disimpan.');
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
