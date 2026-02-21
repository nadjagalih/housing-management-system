<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $types = PaymentType::orderBy('name')->get();

        return response()->json([
            'data' => $types->map(fn($t) => [
                'id'          => $t->id,
                'name'        => $t->name,
                'amount'      => (int) $t->amount,
                'description' => $t->description,
                'is_active'   => $t->is_active,
            ]),
        ]);
    }

    public function update(Request $request, PaymentType $paymentType): JsonResponse
    {
        $validated = $request->validate([
            'amount'      => ['sometimes', 'integer', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $paymentType->update($validated);

        return response()->json([
            'message' => 'Iuran berhasil diperbarui',
            'data'    => [
                'id'          => $paymentType->id,
                'name'        => $paymentType->name,
                'amount'      => (int) $paymentType->amount,
                'description' => $paymentType->description,
                'is_active'   => $paymentType->is_active,
            ],
        ]);
    }
}
