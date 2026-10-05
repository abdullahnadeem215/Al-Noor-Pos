<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Sale\CalculateSaleRequest;
use App\Http\Requests\Api\V1\Sale\StoreSaleRequest;
use App\Models\Sale;
use App\Services\SaleService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Sale::query()->with(['customer', 'cashier']);

        if (!empty($request->invoice_number)) {
            $query->where('invoice_number', 'ILIKE', "%{$request->invoice_number}%");
        }

        if (!empty($request->customer_id)) {
            $query->where('customer_id', $request->customer_id);
        }

        if (!empty($request->payment_status)) {
            $query->where('payment_status', $request->payment_status);
        }

        if (!empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if (!empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $sales = $query->latest()->paginate($request->per_page ?? 20);

        return ApiResponse::success($sales, 'Sales retrieved successfully.');
    }

    public function calculate(CalculateSaleRequest $request): JsonResponse
    {
        $calculation = $this->saleService->calculateCart($request->validated()['items']);

        return ApiResponse::success($calculation, 'Cart calculation preview generated.');
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $sale = $this->saleService->finalizeSale($request->validated(), $request->user());

        return ApiResponse::success($sale, 'Sale finalized successfully.', 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        return ApiResponse::success($sale->load(['items', 'payments', 'customer', 'cashier', 'returns']), 'Sale invoice details.');
    }
}
