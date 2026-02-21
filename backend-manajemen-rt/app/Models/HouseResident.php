<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HouseResident extends Model
{
    protected $fillable = [
        'house_id',
        'resident_id',
        'occupancy_type',
        'start_date',
        'end_date',
        'is_active',
        'contract_duration',
        'notes',
    ];

    protected $casts = [
        'is_active'         => 'boolean',
        'start_date'        => 'date',
        'end_date'          => 'date',
        'contract_duration' => 'integer',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }
}
