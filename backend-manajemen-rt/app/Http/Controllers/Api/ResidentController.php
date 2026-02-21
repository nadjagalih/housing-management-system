<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Resident\StoreResidentRequest;
use App\Http\Requests\Resident\UpdateResidentRequest;
use App\Http\Resources\ResidentResource;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Resident::with(['houseResidents.house'])->whereNull('deleted_at');

        if ($request->filled('type')) {
            $query->where('resident_type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('full_name', 'like', '%' . $request->search . '%');
        }

        $residents = $query->orderBy('full_name')->get();
        $total     = $residents->count();
        $permanent = $residents->where('resident_type', 'tetap')->count();

        return response()->json([
            'data' => ResidentResource::collection($residents),
            'meta' => [
                'total'     => $total,
                'permanent' => $permanent,
                'contract'  => $total - $permanent,
            ],
        ]);
    }

    public function show(Resident $resident): JsonResponse
    {
        $resident->load(['houseResidents.house']);

        $activeHouseResident = $resident->houseResidents->firstWhere('is_active', true);
        $currentHouse        = $activeHouseResident?->house;

        $houseHistory = $resident->houseResidents->sortByDesc('start_date')->map(fn($hr) => [
            'house'      => ['house_number' => $hr->house?->house_number],
            'start_date' => $hr->start_date?->toDateString(),
            'end_date'   => $hr->end_date?->toDateString(),
            'is_active'  => $hr->is_active,
        ])->values();

        return response()->json([
            'data' => array_merge((new ResidentResource($resident))->toArray(request()), [
                'current_house' => $currentHouse ? [
                    'id'           => $currentHouse->id,
                    'house_number' => $currentHouse->house_number,
                    'block'        => $currentHouse->block,
                ] : null,
                'house_history' => $houseHistory,
            ]),
        ]);
    }

    public function store(StoreResidentRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo'] = $request->file('ktp_photo')->store('ktp', 'public');
        }

        $resident = Resident::create($data);

        return response()->json([
            'message' => 'Penghuni berhasil ditambahkan',
            'data'    => [
                'id'            => $resident->id,
                'full_name'     => $resident->full_name,
                'ktp_photo_url' => $resident->ktp_photo ? url('storage/' . $resident->ktp_photo) : null,
            ],
        ], 201);
    }

    public function update(UpdateResidentRequest $request, Resident $resident): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            // Hapus foto lama jika ada
            if ($resident->ktp_photo) {
                Storage::disk('public')->delete($resident->ktp_photo);
            }
            $data['ktp_photo'] = $request->file('ktp_photo')->store('ktp', 'public');
        } elseif ($request->boolean('remove_ktp') && $resident->ktp_photo) {
            // User menghapus foto KTP tanpa menggantinya
            Storage::disk('public')->delete($resident->ktp_photo);
            $data['ktp_photo'] = null;
        }

        unset($data['remove_ktp']);

        $resident->update($data);

        // Jika resident_type diubah dan penghuni sedang aktif di sebuah rumah,
        // sinkronisasi house_type rumah tersebut agar mengikuti tipe baru
        if (isset($data['resident_type'])) {
            $activeHouseResident = $resident->houseResidents()
                ->where('is_active', true)
                ->with('house')
                ->first();

            if ($activeHouseResident?->house) {
                $activeHouseResident->house->update([
                    'house_type' => $data['resident_type'],
                ]);
                $activeHouseResident->update([
                    'occupancy_type' => $data['resident_type'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Data penghuni diperbarui',
            'data'    => new ResidentResource($resident->load('houseResidents.house')),
        ]);
    }

    public function destroy(Resident $resident): JsonResponse
    {
        // Cek apakah masih aktif menghuni rumah
        $isOccupying = $resident->houseResidents()->where('is_active', true)->exists();

        if ($isOccupying) {
            return response()->json([
                'message' => 'Penghuni tidak bisa dinonaktifkan karena masih aktif menghuni rumah.',
            ], 422);
        }

        // Hapus foto KTP dari storage jika ada
        if ($resident->ktp_photo) {
            Storage::disk('public')->delete($resident->ktp_photo);
        }

        $resident->update(['is_active' => false]);
        $resident->delete();

        return response()->json(['message' => 'Penghuni berhasil dinonaktifkan']);
    }
}
