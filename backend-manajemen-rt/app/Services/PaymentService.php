<?php

namespace App\Services;

use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use App\Models\PaymentType;
use Carbon\Carbon;

class PaymentService
{
    /**
     * Generate tagihan bulanan untuk semua penghuni aktif.
     * Idempotent: skip jika tagihan sudah ada untuk bulan/tahun tersebut.
     */
    public function generateMonthly(int $month, int $year): array
    {
        $paymentTypes    = PaymentType::where('is_active', true)->get();
        $activeResidents = HouseResident::where('is_active', true)
            ->with(['house', 'resident'])
            ->get();

        $generated = 0;
        $skipped   = 0;

        foreach ($activeResidents as $hr) {
            foreach ($paymentTypes as $type) {
                $exists = Payment::where('house_id', $hr->house_id)
                    ->where('payment_type_id', $type->id)
                    ->where('month', $month)
                    ->where('year', $year)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                Payment::create([
                    'house_id'        => $hr->house_id,
                    'resident_id'     => $hr->resident_id,
                    'payment_type_id' => $type->id,
                    'month'           => $month,
                    'year'            => $year,
                    'amount'          => $type->amount,
                    'status'          => 'unpaid',
                    'payment_date'    => null,
                    'due_date'        => Carbon::create($year, $month, 1)->endOfMonth()->toDateString(),
                    'notes'           => null,
                ]);

                $generated++;
            }
        }

        return compact('generated', 'skipped');
    }

    /**
     * Input pembayaran manual.
     * Jika paid_months > 1, tandai tagihan bulan-bulan berikutnya sebagai lunas.
     */
    public function storePayment(array $data): Payment
    {
        $paidMonths  = (int) ($data['paid_months'] ?? 1);
        $month       = (int) $data['month'];
        $year        = (int) $data['year'];

        // Batasi paid_months sesuai sisa masa kontrak (jika penghuni kontrak)
        $houseResident = HouseResident::where('house_id', $data['house_id'])
            ->where('is_active', true)
            ->first();

        if ($houseResident && $houseResident->occupancy_type === 'kontrak' && $houseResident->end_date) {
            $endDate     = $houseResident->end_date;
            $maxMonths   = ($endDate->year - $year) * 12 + ($endDate->month - $month) + 1;
            if ($maxMonths < 1) {
                throw new \InvalidArgumentException('Masa kontrak penghuni sudah berakhir untuk periode ini.');
            }
            if ($paidMonths > $maxMonths) {
                throw new \InvalidArgumentException(
                    "Penghuni kontrak hanya dapat membayar maksimal {$maxMonths} bulan (sampai "
                    . $endDate->locale('id')->isoFormat('MMMM YYYY') . ')'
                );
            }
        }
        $paymentDate = $data['payment_date'];
        $notes       = $data['notes'] ?? null;

        // Tandai / buat tagihan untuk setiap bulan yang dicakup
        $firstPayment = null;
        for ($i = 0; $i < $paidMonths; $i++) {
            $targetDate  = Carbon::create($year, $month, 1)->addMonths($i);
            $targetMonth = (int) $targetDate->month;
            $targetYear  = (int) $targetDate->year;

            $payment = Payment::firstOrCreate(
                [
                    'house_id'        => $data['house_id'],
                    'payment_type_id' => $data['payment_type_id'],
                    'month'           => $targetMonth,
                    'year'            => $targetYear,
                ],
                [
                    'resident_id' => $data['resident_id'],
                    'amount'      => PaymentType::find($data['payment_type_id'])->amount,
                    'status'      => 'unpaid',
                    'due_date'    => Carbon::create($year, $month, 1)->addMonths($i)->endOfMonth()->toDateString(),
                ]
            );

            $payment->update([
                'status'       => 'paid',
                'payment_date' => $paymentDate,
                'notes'        => $notes,
            ]);

            if ($i === 0) {
                $firstPayment = $payment;
            }
        }

        return $firstPayment;
    }

    /**
     * Tandai satu tagihan sebagai lunas.
     */
    public function markPaid(Payment $payment, array $data): Payment
    {
        $payment->update([
            'status'       => 'paid',
            'payment_date' => $data['payment_date'],
            'notes'        => $data['notes'] ?? $payment->notes,
        ]);

        return $payment->fresh();
    }
}
