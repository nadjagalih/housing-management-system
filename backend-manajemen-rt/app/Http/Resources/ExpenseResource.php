<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'category'      => $this->category,
            'description'   => $this->description,
            'amount'        => $this->amount,
            'expense_date'  => $this->expense_date?->toDateString(),
            'month'         => $this->month,
            'year'          => $this->year,
            'is_recurring'  => $this->is_recurring,
            'receipt_photo' => $this->receipt_photo
                ? asset('storage/' . $this->receipt_photo)
                : null,
            'notes'      => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
