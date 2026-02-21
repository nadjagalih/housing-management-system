<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'category',
        'description',
        'amount',
        'expense_date',
        'month',
        'year',
        'is_recurring',
        'receipt_photo',
        'notes',
    ];

    protected $casts = [
        'amount'       => 'integer',
        'month'        => 'integer',
        'year'         => 'integer',
        'expense_date' => 'date',
        'is_recurring' => 'boolean',
    ];
}
