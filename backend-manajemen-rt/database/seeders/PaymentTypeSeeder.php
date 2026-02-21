<?php

namespace Database\Seeders;

use App\Models\PaymentType;
use Illuminate\Database\Seeder;

class PaymentTypeSeeder extends Seeder
{
    public function run(): void
    {
        PaymentType::insert([
            [
                'name'        => 'satpam',
                'amount'      => 100000,
                'description' => 'Iuran keamanan / gaji satpam',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'name'        => 'kebersihan',
                'amount'      => 15000,
                'description' => 'Iuran kebersihan lingkungan',
                'is_active'   => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
        ]);
    }
}
