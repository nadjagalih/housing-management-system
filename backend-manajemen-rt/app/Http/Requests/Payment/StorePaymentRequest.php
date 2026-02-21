<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'house_id'        => ['required', 'exists:houses,id'],
            'resident_id'     => ['required', 'exists:residents,id'],
            'payment_type_id' => ['required', 'exists:payment_types,id'],
            'month'           => ['required', 'integer', 'min:1', 'max:12'],
            'year'            => ['required', 'integer', 'min:2020'],
            'paid_months'     => ['sometimes', 'integer', 'min:1', 'max:12'],
            'payment_date'    => ['required', 'date'],
            'notes'           => ['nullable', 'string'],
        ];
    }
}
