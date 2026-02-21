<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\GenerateMonthlyRequest;
use App\Http\Requests\Payment\MarkPaidRequest;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['house', 'resident', 'paymentType']);

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('house_id')) {
            $query->where('house_id', $request->house_id);
        }

        $payments     = $query->orderBy('year', 'desc')->orderBy('month', 'desc')->get();
        $totalTagihan = $payments->count();
        $lunas        = $payments->where('status', 'paid')->count();

        return response()->json([
            'data'    => PaymentResource::collection($payments),
            'summary' => [
                'total_tagihan' => $totalTagihan,
                'lunas'         => $lunas,
                'belum_lunas'   => $totalTagihan - $lunas,
            ],
        ]);
    }

    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['house', 'resident', 'paymentType']);

        return response()->json(['data' => new PaymentResource($payment)]);
    }

    public function generateMonthly(GenerateMonthlyRequest $request): JsonResponse
    {
        $result = $this->paymentService->generateMonthly(
            (int) $request->month,
            (int) $request->year
        );

        $monthNames = [
            1=>'Jan',2=>'Feb',3=>'Mar',4=>'Apr',5=>'Mei',6=>'Jun',
            7=>'Jul',8=>'Agu',9=>'Sep',10=>'Okt',11=>'Nov',12=>'Des',
        ];

        return response()->json([
            'message'   => 'Tagihan bulan ' . $monthNames[$request->month] . ' ' . $request->year . ' berhasil digenerate',
            'generated' => $result['generated'],
            'skipped'   => $result['skipped'],
        ], 201);
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        try {
            $payment = $this->paymentService->storePayment($request->validated());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $paidMonths = $request->input('paid_months', 1);
        $startDate  = Carbon::create($request->year, $request->month, 1);
        $endDate    = $startDate->copy()->addMonths($paidMonths - 1);
        $covers     = $paidMonths > 1
            ? $startDate->locale('id')->isoFormat('MMM') . ' - ' . $endDate->locale('id')->isoFormat('MMM YYYY')
            : $startDate->locale('id')->isoFormat('MMMM YYYY');

        return response()->json([
            'message' => 'Pembayaran berhasil dicatat',
            'data'    => [
                'id'          => $payment->id,
                'paid_months' => $paidMonths,
                'status'      => $payment->status,
                'covers'      => $covers,
            ],
        ], 201);
    }

    public function markPaid(MarkPaidRequest $request, Payment $payment): JsonResponse
    {
        $this->paymentService->markPaid($payment, $request->validated());

        return response()->json(['message' => 'Tagihan berhasil ditandai lunas']);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        if ($payment->status === 'paid') {
            return response()->json([
                'message' => 'Tagihan yang sudah lunas tidak bisa dihapus.',
            ], 422);
        }

        $payment->delete();

        return response()->json(['message' => 'Data pembayaran berhasil dihapus']);
    }
}
