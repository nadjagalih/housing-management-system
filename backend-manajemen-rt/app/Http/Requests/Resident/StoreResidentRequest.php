<?php

namespace App\Http\Requests\Resident;

use Illuminate\Foundation\Http\FormRequest;

class StoreResidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name'      => ['required', 'string', 'max:100'],
            'ktp_photo'      => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'resident_type'  => ['required', 'in:tetap,kontrak'],
            'phone_number'   => ['nullable', 'string', 'max:20'],
            'marital_status' => ['required', 'in:married,single'],
        ];
    }
}
