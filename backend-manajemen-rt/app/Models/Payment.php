<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'house_id',
        'resident_id',
        'payment_type_id',
        'month',
        'year',
        'amount',
        'status',
        'payment_date',
        'due_date',
        'notes',
    ];

    protected $casts = [
        'amount'       => 'integer',
        'month'        => 'integer',
        'year'         => 'integer',
        'payment_date' => 'date',
        'due_date'     => 'date',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    public function paymentType(): BelongsTo
    {
        return $this->belongsTo(PaymentType::class);
    }
}
