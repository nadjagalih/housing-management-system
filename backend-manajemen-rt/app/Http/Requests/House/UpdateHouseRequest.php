<?php

namespace App\Http\Requests\House;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'house_number' => ['sometimes', 'string', 'max:10', Rule::unique('houses', 'house_number')->ignore($this->route('house'))],
            'block'        => ['sometimes', 'nullable', 'string', 'max:10'],
            'address'      => ['sometimes', 'string', 'max:255'],
            'house_type'   => ['sometimes', 'in:tetap,kontrak'],
            'notes'        => ['sometimes', 'nullable', 'string'],
        ];
    }
}
