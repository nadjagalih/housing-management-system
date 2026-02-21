<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class House extends Model
{
    protected $fillable = [
        'house_number',
        'block',
        'address',
        'status',
        'house_type',
        'notes',
    ];

    protected $casts = [
        'status'     => 'string',
        'house_type' => 'string',
    ];

    /**
     * Semua record penghuni (history + aktif).
     */
    public function houseResidents(): HasMany
    {
        return $this->hasMany(HouseResident::class);
    }

    /**
     * Hanya penghuni yang sedang aktif.
     */
    public function activeResident(): HasOne
    {
        return $this->hasOne(HouseResident::class)->where('is_active', true)->with('resident');
    }

    /**
     * Semua record pembayaran.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
