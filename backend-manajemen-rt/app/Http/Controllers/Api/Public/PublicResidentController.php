<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class PublicResidentController extends Controller
{
    public function index(): JsonResponse
    {
        $activeHouseResidents = HouseResident::with(['resident', 'house'])
            ->where('is_active', true)
            ->get();

        $data = $activeHouseResidents->map(fn($hr) => [
            'full_name'      => $hr->resident?->full_name,
            'phone_number'   => $hr->resident?->phone_number,
            'marital_status' => $hr->resident?->marital_status,
            'house'          => [
                'house_number' => $hr->house?->house_number,
                'block'        => $hr->house?->block,
            ],
        ])->values();

        return response()->json(['data' => $data]);
    }

    public function show(string $houseNumber): JsonResponse
    {
        $house = House::where('house_number', $houseNumber)->firstOrFail();

        $activeHouseResident = HouseResident::with('resident')
            ->where('house_id', $house->id)
            ->where('is_active', true)
            ->first();

        if (!$activeHouseResident) {
            return response()->json([
                'house_number' => $houseNumber,
                'resident'     => null,
                'tagihan_bulan_ini' => [],
            ]);
        }

        $now      = Carbon::now();
        $payments = Payment::with('paymentType')
            ->where('house_id', $house->id)
            ->where('month', $now->month)
            ->where('year', $now->year)
            ->get();

        $resident = $activeHouseResident->resident;

        return response()->json([
            'house_number' => $houseNumber,
            'resident'     => [
                'full_name'      => $resident?->full_name,
                'phone_number'   => $resident?->phone_number,
                'marital_status' => $resident?->marital_status,
            ],
            'tagihan_bulan_ini' => $payments->map(fn($p) => [
                'type'   => $p->paymentType?->name,
                'amount' => (int) $p->amount,
                'status' => $p->status,
            ])->values(),
        ]);
    }
}
