<?php

namespace App\Http\Requests\House;

use Illuminate\Foundation\Http\FormRequest;

class UnassignResidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'end_date' => ['required', 'date'],
            'notes'    => ['nullable', 'string'],
        ];
    }
}
