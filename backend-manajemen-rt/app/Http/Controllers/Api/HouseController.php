<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\House\AssignResidentRequest;
use App\Http\Requests\House\StoreHouseRequest;
use App\Http\Requests\House\UnassignResidentRequest;
use App\Http\Requests\House\UpdateHouseRequest;
use App\Http\Resources\HouseResource;
use App\Models\House;
use App\Services\HouseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HouseController extends Controller
{
    public function __construct(private HouseService $houseService) {}

    public function index(Request $request): JsonResponse
    {
        $query = House::with(['activeResident.resident']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('house_type', $request->type);
        }

        $houses   = $query->orderBy('house_number')->get();
        $total    = House::count();
        $occupied = House::where('status', 'occupied')->count();

        return response()->json([
            'data' => HouseResource::collection($houses),
            'meta' => [
                'total'    => $total,
                'occupied' => $occupied,
                'empty'    => $total - $occupied,
            ],
        ]);
    }

    public function show(House $house): JsonResponse
    {
        $house->load(['activeResident.resident', 'houseResidents.resident', 'payments.paymentType', 'payments.resident']);

        $residentHistory = $house->houseResidents->sortByDesc('start_date')->map(fn($hr) => [
            'resident'   => ['full_name' => $hr->resident?->full_name],
            'start_date' => $hr->start_date?->toDateString(),
            'end_date'   => $hr->end_date?->toDateString(),
            'is_active'  => $hr->is_active,
        ])->values();

        // Group payment history by month/year
        $paymentHistory = $house->payments
            ->groupBy(fn($p) => $p->year . '-' . str_pad($p->month, 2, '0', STR_PAD_LEFT))
            ->sortKeys()
            ->map(function ($payments) {
                $first = $payments->first();
                return [
                    'month'    => $first->month,
                    'year'     => $first->year,
                    'resident' => ['full_name' => $first->resident?->full_name],
                    'payments' => $payments->map(fn($p) => [
                        'type'   => $p->paymentType?->name,
                        'status' => $p->status,
                        'amount' => (int) $p->amount,
                    ])->values(),
                ];
            })
            ->sortByDesc(fn($item) => $item['year'] * 100 + $item['month'])
            ->values();

        $activeResidentModel = $house->activeResident?->resident;

        return response()->json([
            'data' => array_merge((new HouseResource($house))->toArray(request()), [
                'active_resident'  => $activeResidentModel ? [
                    'id'            => $activeResidentModel->id,
                    'full_name'     => $activeResidentModel->full_name,
                    'phone_number'  => $activeResidentModel->phone_number,
                    'resident_type' => $activeResidentModel->resident_type,
                ] : null,
                'resident_history' => $residentHistory,
                'payment_history'  => $paymentHistory,
            ]),
        ]);
    }

    public function store(StoreHouseRequest $request): JsonResponse
    {
        $house = House::create($request->validated());

        return response()->json([
            'message' => 'Rumah berhasil ditambahkan',
            'data'    => ['id' => $house->id, 'house_number' => $house->house_number],
        ], 201);
    }

    public function update(UpdateHouseRequest $request, House $house): JsonResponse
    {
        $house->update($request->validated());

        return response()->json([
            'message' => 'Rumah berhasil diperbarui',
            'data'    => new HouseResource($house->load('activeResident.resident')),
        ]);
    }

    public function assignResident(AssignResidentRequest $request, House $house): JsonResponse
    {
        $houseResident = $this->houseService->assignResident($house, $request->validated());

        return response()->json([
            'message' => 'Penghuni berhasil di-assign',
            'data'    => [
                'house_id'    => $houseResident->house_id,
                'resident_id' => $houseResident->resident_id,
                'start_date'  => $houseResident->start_date?->toDateString(),
                'is_active'   => $houseResident->is_active,
            ],
        ]);
    }

    public function unassignResident(UnassignResidentRequest $request, House $house): JsonResponse
    {
        $this->houseService->unassignResident($house, $request->validated());

        return response()->json(['message' => 'Penghuni berhasil dilepas dari rumah']);
    }
}
