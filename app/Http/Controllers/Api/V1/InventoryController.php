<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MovementType;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    public function movements(Request $request): JsonResponse
    {
        $movements = $this->inventoryService->getMovements($request->all());

        return ApiResponse::success($movements, 'Inventory movements history.');
    }

    public function lowStock(): JsonResponse
    {
        $products = $this->inventoryService->getLowStockProducts();

        return ApiResponse::success($products, 'Low stock products list.');
    }

    public function adjust(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'delta' => ['required', 'numeric', 'not_in:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $movement = $this->inventoryService->adjustStock(
            product: $product,
            delta: (float) $data['delta'],
            movementType: MovementType::ADJUSTMENT,
            referenceType: Product::class,
            referenceId: $product->id,
            userId: $request->user()?->id,
            notes: $data['notes'] ?? 'Manual stock adjustment'
        );

        return ApiResponse::success($movement->load('product'), 'Inventory stock adjusted.');
    }
}
