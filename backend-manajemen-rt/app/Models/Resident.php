<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Resident extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'full_name',
        'ktp_photo',
        'resident_type',
        'phone_number',
        'marital_status',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Semua record hunian (history + aktif).
     */
    public function houseResidents(): HasMany
    {
        return $this->hasMany(HouseResident::class);
    }

    /**
     * Relasi ke rumah yang sedang dihuni saat ini (aktif).
     */
    public function currentHouse(): HasOneThrough
    {
        return $this->hasOneThrough(
            House::class,
            HouseResident::class,
            'resident_id', // FK di house_residents
            'id',          // FK di houses
            'id',          // PK di residents
            'house_id'     // FK di house_residents → houses
        )->where('house_residents.is_active', true);
    }

    /**
     * Semua pembayaran milik penghuni ini.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
