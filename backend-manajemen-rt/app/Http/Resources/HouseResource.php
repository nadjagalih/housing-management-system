<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HouseResource extends JsonResource
{
    public function toArray($request): array
    {
        $activeHouseResident = $this->activeResident;
        $activeResident      = $activeHouseResident?->resident;

        return [
            'id'              => $this->id,
            'house_number'    => $this->house_number,
            'block'           => $this->block,
            'address'         => $this->address,
            'status'          => $this->status,
            'house_type'      => $this->house_type,
            'notes'           => $this->notes,
            'active_resident' => $activeResident ? [
                'id'                => $activeResident->id,
                'full_name'         => $activeResident->full_name,
                'phone_number'      => $activeResident->phone_number,
                'resident_type'     => $activeResident->resident_type,
                'occupancy_type'    => $activeHouseResident->occupancy_type,
                'start_date'        => $activeHouseResident->start_date?->toDateString(),
                'end_date'          => $activeHouseResident->end_date?->toDateString(),
                'contract_duration' => $activeHouseResident->contract_duration,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
