<?php

namespace App\Http\Requests\House;

use Illuminate\Foundation\Http\FormRequest;

class AssignResidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Ambil tipe penghuni dari database
        $resident  = \App\Models\Resident::find($this->resident_id);
        $isKontrak = $resident && $resident->resident_type === 'kontrak';

        return [
            'resident_id'       => [
                'required',
                'exists:residents,id',
                // Pastikan penghuni belum menghuni rumah lain
                function ($attribute, $value, $fail) {
                    $sudahDihuni = \App\Models\HouseResident::where('resident_id', $value)
                        ->where('is_active', true)
                        ->exists();
                    if ($sudahDihuni) {
                        $fail('Penghuni ini sudah memiliki hunian aktif di rumah lain.');
                    }
                },
            ],
            'start_date'        => ['required', 'date'],
            // Wajib diisi hanya jika penghuni bertipe kontrak
            'contract_duration' => $isKontrak
                                    ? ['required', 'integer', 'min:1']
                                    : ['nullable', 'integer', 'min:1'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
