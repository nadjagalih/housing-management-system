<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reportService) {}

    public function dashboard(): JsonResponse
    {
        return response()->json($this->reportService->getDashboard());
    }

    public function summary(Request $request): JsonResponse
    {
        $year = (int) ($request->query('year', Carbon::now()->year));

        return response()->json($this->reportService->getMonthlySummary($year));
    }

    public function monthlyDetail(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year'  => ['required', 'integer', 'min:2020'],
        ]);

        return response()->json($this->reportService->getMonthlyDetail(
            (int) $request->month,
            (int) $request->year
        ));
    }

    public function unpaid(Request $request): JsonResponse
    {
        $now   = Carbon::now();
        $month = (int) ($request->query('month', $now->month));
        $year  = (int) ($request->query('year', $now->year));

        return response()->json($this->reportService->getUnpaid($month, $year));
    }
}
