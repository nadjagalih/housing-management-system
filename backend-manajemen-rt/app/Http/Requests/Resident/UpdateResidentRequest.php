<?php

namespace App\Http\Requests\Resident;

use Illuminate\Foundation\Http\FormRequest;

class UpdateResidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name'      => ['sometimes', 'string', 'max:100'],
            'ktp_photo'      => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'remove_ktp'     => ['sometimes', 'boolean'],
            'resident_type'  => ['sometimes', 'in:tetap,kontrak'],
            'phone_number'   => ['sometimes', 'nullable', 'string', 'max:20'],
            'marital_status' => ['sometimes', 'in:married,single'],
        ];
    }
}
