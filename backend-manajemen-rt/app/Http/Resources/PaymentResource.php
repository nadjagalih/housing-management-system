<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'house'        => $this->whenLoaded('house', fn() => [
                'id'           => $this->house->id,
                'house_number' => $this->house->house_number,
            ]),
            'resident'     => $this->whenLoaded('resident', fn() => [
                'id'        => $this->resident->id,
                'full_name' => $this->resident->full_name,
            ]),
            'payment_type' => $this->whenLoaded('paymentType', fn() => [
                'id'     => $this->paymentType->id,
                'name'   => $this->paymentType->name,
                'amount' => $this->paymentType->amount,
            ]),
            'month'        => $this->month,
            'year'         => $this->year,
            'amount'       => $this->amount,
            'status'       => $this->status,
            'payment_date' => $this->payment_date?->toDateString(),
            'due_date'     => $this->due_date?->toDateString(),
            'notes'        => $this->notes,
            'created_at'   => $this->created_at,
        ];
    }
}
