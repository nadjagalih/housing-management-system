<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ResidentResource extends JsonResource
{
    public function toArray($request): array
    {
        $currentHouseResident = $this->houseResidents->firstWhere('is_active', true);
        $currentHouse         = $currentHouseResident?->house;

        return [
            'id'              => $this->id,
            'full_name'       => $this->full_name,
            'ktp_photo_url'   => $this->ktp_photo
                ? url('storage/' . $this->ktp_photo)
                : null,
            'resident_type'   => $this->resident_type,
            'phone_number'    => $this->phone_number,
            'marital_status'  => $this->marital_status,
            'is_active'       => $this->is_active,
            'current_house'   => $currentHouse ? [
                'id'           => $currentHouse->id,
                'house_number' => $currentHouse->house_number,
                'block'        => $currentHouse->block,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
