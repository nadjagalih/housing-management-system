<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Public\PublicResidentController;

Route::prefix('v1')->group(function () {

    // -------------------------------------------------------
    // Public — Portal Warga (no auth)
    // -------------------------------------------------------
    Route::prefix('public')->group(function () {
        Route::get('residents', [PublicResidentController::class, 'index']);
        Route::get('residents/{houseNumber}', [PublicResidentController::class, 'show']);
    });

    // -------------------------------------------------------
    // Authentication
    // -------------------------------------------------------
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        // -------------------------------------------------------
        // Houses
        // -------------------------------------------------------
        Route::post('houses/{house}/assign-resident', [HouseController::class, 'assignResident']);
        Route::post('houses/{house}/unassign-resident', [HouseController::class, 'unassignResident']);
        Route::apiResource('houses', HouseController::class)->only(['index', 'store', 'show', 'update']);

        // -------------------------------------------------------
        // Residents
        // -------------------------------------------------------
        Route::apiResource('residents', ResidentController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

        // -------------------------------------------------------
        // Payment Types
        // -------------------------------------------------------
        Route::get('payment-types', [PaymentTypeController::class, 'index']);
        Route::put('payment-types/{paymentType}', [PaymentTypeController::class, 'update']);

        // -------------------------------------------------------
        // Payments
        // ⚠️ generate-monthly HARUS sebelum apiResource agar tidak
        //    dianggap sebagai {payment} ID
        // -------------------------------------------------------
        Route::post('payments/generate-monthly', [PaymentController::class, 'generateMonthly']);
        Route::put('payments/{payment}/mark-paid', [PaymentController::class, 'markPaid']);
        Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show', 'destroy']);

        // -------------------------------------------------------
        // Expenses
        // -------------------------------------------------------
        Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store', 'update', 'destroy']);

        // -------------------------------------------------------
        // Reports
        // -------------------------------------------------------
        Route::prefix('reports')->group(function () {
            Route::get('dashboard', [ReportController::class, 'dashboard']);
            Route::get('summary', [ReportController::class, 'summary']);
            Route::get('monthly-detail', [ReportController::class, 'monthlyDetail']);
            Route::get('unpaid', [ReportController::class, 'unpaid']);
        });
    });
});
