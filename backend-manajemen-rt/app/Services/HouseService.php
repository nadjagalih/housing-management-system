<?php

namespace App\Services;

use App\Models\House;
use App\Models\HouseResident;
use Carbon\Carbon;

class HouseService
{
    /**
     * Assign penghuni ke rumah.
     * Jika sudah ada penghuni aktif, otomatis tutup (set end_date) terlebih dahulu.
     */
    public function assignResident(House $house, array $data): HouseResident
    {
        // Nonaktifkan penghuni lama jika ada
        HouseResident::where('house_id', $house->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'end_date'  => now()->toDateString(),
            ]);

        // Deteksi tipe dari data penghuni
        $resident      = \App\Models\Resident::findOrFail($data['resident_id']);
        $occupancyType = $resident->resident_type; // 'tetap' atau 'kontrak'

        // Hitung end_date otomatis hanya jika kontrak
        $endDate = null;
        if ($occupancyType === 'kontrak' && isset($data['contract_duration'])) {
            $endDate = Carbon::parse($data['start_date'])
                ->addMonths($data['contract_duration'])
                ->toDateString();
        }

        $houseResident = HouseResident::create([
            'house_id'          => $house->id,
            'resident_id'       => $data['resident_id'],
            'occupancy_type'    => $occupancyType,
            'start_date'        => $data['start_date'],
            'end_date'          => $endDate,
            'contract_duration' => $data['contract_duration'] ?? null,
            'notes'             => $data['notes'] ?? null,
            'is_active'         => true,
        ]);

        // house_type mengikuti tipe penghuni yang di-assign
        $house->update([
            'status'     => 'occupied',
            'house_type' => $occupancyType,
        ]);

        return $houseResident;
    }

    /**
     * Lepas penghuni dari rumah (unassign).
     */
    public function unassignResident(House $house, array $data): void
    {
        HouseResident::where('house_id', $house->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'end_date'  => $data['end_date'],
                'notes'     => $data['notes'] ?? null,
            ]);

        $house->update(['status' => 'empty']);
    }
}
