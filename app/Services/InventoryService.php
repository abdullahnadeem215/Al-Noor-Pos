<?php

namespace App\Services;

use App\Enums\MovementType;
use App\Enums\SellingMode;
use App\Exceptions\InsufficientStockException;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Adjust product stock atomically within DB transaction.
     * Positive delta increases stock, negative delta decreases stock.
     */
    public function adjustStock(
        Product $product,
        float $delta,
        MovementType $movementType,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?int $userId = null,
        ?string $notes = null
    ): InventoryMovement {
        return DB::transaction(function () use ($product, $delta, $movementType, $referenceType, $referenceId, $userId, $notes) {
            // Lock product row for concurrency safety
            $lockedProduct = Product::where('id', $product->id)->lockForUpdate()->firstOrFail();

            $stockBefore = (float) $lockedProduct->current_stock;
            $stockAfter = $stockBefore + $delta;

            $negativeAllowed = (bool) Setting::get('negative_stock_allowed', false);

            if ($stockAfter < 0 && !$negativeAllowed) {
                $unit = $lockedProduct->selling_mode === SellingMode::WEIGHT ? 'g' : ' units';
                throw new InsufficientStockException(
                    "Insufficient stock for {$lockedProduct->name}. Requested delta: {$delta}{$unit}, Available stock: {$stockBefore}{$unit}."
                );
            }

            $lockedProduct->update(['current_stock' => $stockAfter]);

            return InventoryMovement::create([
                'product_id' => $lockedProduct->id,
                'movement_type' => $movementType,
                'quantity_or_grams' => $delta,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'user_id' => $userId,
                'notes' => $notes,
                'created_at' => now(),
            ]);
        });
    }

    public function getMovements(array $filters = []): LengthAwarePaginator
    {
        $query = InventoryMovement::query()->with(['product', 'user']);

        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (!empty($filters['movement_type'])) {
            $query->where('movement_type', $filters['movement_type']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        return $query->latest('id')->paginate($filters['per_page'] ?? 20);
    }

    public function getLowStockProducts(): Collection
    {
        return Product::query()
            ->where('status', 'active')
            ->whereRaw('current_stock <= minimum_stock')
            ->with('category')
            ->get();
    }

    public function getStockSummary(): array
    {
        $totalProducts = Product::where('status', 'active')->count();
        $lowStockCount = Product::where('status', 'active')->whereRaw('current_stock <= minimum_stock')->count();

        // Calculate total inventory valuation based on purchase_price
        $weightStockValuation = Product::where('status', 'active')
            ->where('selling_mode', SellingMode::WEIGHT)
            ->selectRaw('SUM((current_stock / 1000.0) * purchase_price) as val')
            ->value('val') ?? 0.0;

        $quantityStockValuation = Product::where('status', 'active')
            ->where('selling_mode', SellingMode::QUANTITY)
            ->selectRaw('SUM(current_stock * purchase_price) as val')
            ->value('val') ?? 0.0;

        $totalValuation = round((float) $weightStockValuation + (float) $quantityStockValuation, 2);

        return [
            'total_products' => $totalProducts,
            'low_stock_count' => $lowStockCount,
            'total_stock_valuation' => $totalValuation,
        ];
    }
}
