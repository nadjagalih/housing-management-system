<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::query();

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->get();

        return response()->json([
            'data'    => ExpenseResource::collection($expenses),
            'summary' => [
                'total_pengeluaran' => (int) $expenses->sum('amount'),
            ],
        ]);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = Expense::create($request->validated());

        return response()->json([
            'message' => 'Pengeluaran berhasil dicatat',
            'data'    => new ExpenseResource($expense),
        ], 201);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'category'     => ['sometimes', 'in:gaji_satpam,token_listrik,perbaikan_jalan,perbaikan_selokan,other'],
            'description'  => ['sometimes', 'string', 'max:255'],
            'amount'       => ['sometimes', 'integer', 'min:1'],
            'expense_date' => ['sometimes', 'date'],
            'month'        => ['sometimes', 'integer', 'min:1', 'max:12'],
            'year'         => ['sometimes', 'integer', 'min:2020'],
            'is_recurring' => ['sometimes', 'boolean'],
            'notes'        => ['sometimes', 'nullable', 'string'],
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'Pengeluaran diperbarui',
            'data'    => new ExpenseResource($expense),
        ]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json(['message' => 'Pengeluaran berhasil dihapus']);
    }
}
