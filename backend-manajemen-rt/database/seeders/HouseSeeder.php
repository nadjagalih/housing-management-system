<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\HouseResident;
use App\Models\Resident;
use Illuminate\Database\Seeder;

class HouseSeeder extends Seeder
{
    public function run(): void
    {
        // -------------------------------------------------------
        // 20 Rumah: 15 tetap (blok A & B) + 5 kontrakan (blok C)
        // -------------------------------------------------------
        $houses = [];

        // Blok A — 8 rumah tetap
        for ($i = 1; $i <= 8; $i++) {
            $houses[] = [
                'house_number' => 'A' . $i,
                'block'        => 'A',
                'address'      => 'Jl. Perumahan Blok A No.' . $i,
                'status'       => 'empty',
                'house_type'   => 'tetap',
                'notes'        => null,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        // Blok B — 7 rumah tetap
        for ($i = 1; $i <= 7; $i++) {
            $houses[] = [
                'house_number' => 'B' . $i,
                'block'        => 'B',
                'address'      => 'Jl. Perumahan Blok B No.' . $i,
                'status'       => 'empty',
                'house_type'   => 'tetap',
                'notes'        => null,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        // Blok C — 5 rumah kontrakan
        for ($i = 1; $i <= 5; $i++) {
            $houses[] = [
                'house_number' => 'C' . $i,
                'block'        => 'C',
                'address'      => 'Jl. Perumahan Blok C No.' . $i,
                'status'       => 'empty',
                'house_type'   => 'kontrak',
                'notes'        => 'Rumah kontrakan',
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        House::insert($houses);

        // -------------------------------------------------------
        // 15 Penghuni tetap + 2 penghuni kontrakan
        // -------------------------------------------------------
        $residents = [
            // 15 penghuni tetap
            ['full_name' => 'Budi Santoso',      'resident_type' => 'tetap',   'phone_number' => '081234567890', 'marital_status' => 'married'],
            ['full_name' => 'Siti Rahayu',        'resident_type' => 'tetap',   'phone_number' => '081234567891', 'marital_status' => 'married'],
            ['full_name' => 'Ahmad Fauzi',        'resident_type' => 'tetap',   'phone_number' => '081234567892', 'marital_status' => 'married'],
            ['full_name' => 'Dewi Lestari',       'resident_type' => 'tetap',   'phone_number' => '081234567893', 'marital_status' => 'married'],
            ['full_name' => 'Eko Prasetyo',       'resident_type' => 'tetap',   'phone_number' => '081234567894', 'marital_status' => 'married'],
            ['full_name' => 'Fitri Handayani',    'resident_type' => 'tetap',   'phone_number' => '081234567895', 'marital_status' => 'single'],
            ['full_name' => 'Gunawan Setiadi',    'resident_type' => 'tetap',   'phone_number' => '081234567896', 'marital_status' => 'married'],
            ['full_name' => 'Heni Wijayanti',     'resident_type' => 'tetap',   'phone_number' => '081234567897', 'marital_status' => 'married'],
            ['full_name' => 'Irfan Maulana',      'resident_type' => 'tetap',   'phone_number' => '081234567898', 'marital_status' => 'single'],
            ['full_name' => 'Joko Susanto',       'resident_type' => 'tetap',   'phone_number' => '081234567899', 'marital_status' => 'married'],
            ['full_name' => 'Kartini Wahyu',      'resident_type' => 'tetap',   'phone_number' => '082111111101', 'marital_status' => 'married'],
            ['full_name' => 'Lukman Hakim',       'resident_type' => 'tetap',   'phone_number' => '082111111102', 'marital_status' => 'married'],
            ['full_name' => 'Mega Puspita',       'resident_type' => 'tetap',   'phone_number' => '082111111103', 'marital_status' => 'single'],
            ['full_name' => 'Nanda Putra',        'resident_type' => 'tetap',   'phone_number' => '082111111104', 'marital_status' => 'married'],
            ['full_name' => 'Rina Oktavia',       'resident_type' => 'tetap',   'phone_number' => '082111111105', 'marital_status' => 'married'],
            // 2 penghuni kontrakan (durasi 6 bulan)
            ['full_name' => 'Surya Dinata',       'resident_type' => 'kontrak', 'phone_number' => '083122221101', 'marital_status' => 'single'],
            ['full_name' => 'Wahyu Nugroho',      'resident_type' => 'kontrak', 'phone_number' => '083122221102', 'marital_status' => 'married'],
        ];

        foreach ($residents as &$r) {
            $r['ktp_photo']  = null;
            $r['is_active']  = true;
            $r['created_at'] = now();
            $r['updated_at'] = now();
        }
        unset($r);

        Resident::insert($residents);

        // -------------------------------------------------------
        // Assign penghuni ke rumah
        // -------------------------------------------------------
        $startDate = \Carbon\Carbon::create(2025, 1, 1);

        // Penghuni tetap (id 1–15) → rumah A1–A8, B1–B7
        $permanentHouseNumbers = [
            'A1','A2','A3','A4','A5','A6','A7','A8',
            'B1','B2','B3','B4','B5','B6','B7',
        ];

        foreach ($permanentHouseNumbers as $idx => $houseNumber) {
            $residentId = $idx + 1; // id 1–15
            $house      = House::where('house_number', $houseNumber)->first();
            $house->update(['status' => 'occupied']);

            HouseResident::create([
                'house_id'          => $house->id,
                'resident_id'       => $residentId,
                'occupancy_type'    => 'tetap',
                'start_date'        => $startDate,
                'end_date'          => null,
                'is_active'         => true,
                'contract_duration' => null,
                'notes'             => null,
            ]);
        }

        // Penghuni kontrakan (id 16–17) → rumah C1–C2, durasi 6 bulan
        $contractStartDate = \Carbon\Carbon::create(2025, 7, 1); // mulai Juli 2025
        $contractData = [
            ['house' => 'C1', 'resident_offset' => 16],
            ['house' => 'C2', 'resident_offset' => 17],
        ];

        foreach ($contractData as $data) {
            $house     = House::where('house_number', $data['house'])->first();
            $endDate   = $contractStartDate->copy()->addMonths(6);
            $house->update(['status' => 'occupied']);

            HouseResident::create([
                'house_id'          => $house->id,
                'resident_id'       => $data['resident_offset'],
                'occupancy_type'    => 'kontrak',
                'start_date'        => $contractStartDate,
                'end_date'          => $endDate,
                'is_active'         => true,
                'contract_duration' => 6,
                'notes'             => 'Kontrak 6 bulan (Jul–Des 2025)',
            ]);
        }

        // C3, C4, C5 tetap kosong (status default 'empty')
    }
}
