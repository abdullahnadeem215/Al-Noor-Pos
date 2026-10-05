<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Purchase\StorePurchaseRequest;
use App\Models\Purchase;
use App\Services\PurchaseService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Purchase::query()->with(['supplier', 'creator']);

        if (!empty($request->reference_number)) {
            $query->where('reference_number', 'ILIKE', "%{$request->reference_number}%");
        }

        if (!empty($request->supplier_id)) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $purchases = $query->latest()->paginate($request->per_page ?? 20);

        return ApiResponse::success($purchases, 'Purchases retrieved.');
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $purchase = $this->purchaseService->createPurchase($request->validated(), $request->user());

        return ApiResponse::success($purchase, 'Purchase recorded and inventory updated.', 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return ApiResponse::success($purchase->load(['items', 'supplier', 'creator']), 'Purchase details.');
    }
}
