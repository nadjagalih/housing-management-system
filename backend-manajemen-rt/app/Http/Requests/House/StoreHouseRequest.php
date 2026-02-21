<?php

namespace App\Http\Requests\House;

use Illuminate\Foundation\Http\FormRequest;

class StoreHouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'house_number' => ['required', 'string', 'max:10', 'unique:houses,house_number'],
            'block'        => ['nullable', 'string', 'max:10'],
            'address'      => ['required', 'string', 'max:255'],
            'house_type'   => ['required', 'in:tetap,kontrak'],
            'notes'        => ['nullable', 'string'],
        ];
    }
}
