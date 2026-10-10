<?php

namespace App\Services;

use App\Enums\MovementType;
use App\Enums\SellingMode;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductPriceHistory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function __construct(
        protected WeightCalculationService $weightService
    ) {}

    public function searchProducts(array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()->with('category');

        if (!empty($filters['q'])) {
            $term = $filters['q'];
            $query->where(function ($q) use ($term) {
                $q->where('name', 'ILIKE', "%{$term}%")
                    ->orWhere('sku', 'ILIKE', "%{$term}%")
                    ->orWhere('barcode', 'ILIKE', "%{$term}%");
            });
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['selling_mode'])) {
            $query->where('selling_mode', $filters['selling_mode']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->where('status', 'active');
        }

        $perPage = (int) ($filters['per_page'] ?? 50);

        return $query->orderBy('name')->paginate($perPage);
    }

    public function createProduct(array $data, ?int $userId = null): Product
    {
        return DB::transaction(function () use ($data, $userId) {
            $sellingMode = SellingMode::from($data['selling_mode']);

            $data['created_by'] = $userId;
            $data['sku'] = $data['sku'] ?? 'PRD-' . strtoupper(Str::random(8));

            if ($sellingMode === SellingMode::WEIGHT) {
                $data['stock_unit'] = 'gram';
                $data['base_unit'] = $data['base_unit'] ?? 'kg';

                // Normalize opening stock
                $openingGrams = 0.0;
                if (isset($data['opening_stock_grams'])) {
                    $openingGrams = (float) $data['opening_stock_grams'];
                } elseif (isset($data['opening_stock_kg'])) {
                    $openingGrams = $this->weightService->normalizeToGrams($data['opening_stock_kg'], 'kg');
                } elseif (isset($data['current_stock']) && (float) $data['current_stock'] > 0) {
                    $val = (float) $data['current_stock'];
                    $openingGrams = $val >= 1000 ? $val : $val * 1000;
                } elseif (isset($data['opening_stock']) && (float) $data['opening_stock'] > 0) {
                    $val = (float) $data['opening_stock'];
                    $openingGrams = $val >= 1000 ? $val : $val * 1000;
                }
                $data['current_stock'] = $openingGrams;

                $minVal = isset($data['minimum_stock']) ? (float) $data['minimum_stock'] : 1.0;
                $data['minimum_stock'] = $minVal >= 1000 ? $minVal : $minVal * 1000;
            } else {
                $data['stock_unit'] = $data['stock_unit'] ?? 'piece';
                $data['base_unit'] = $data['base_unit'] ?? 'piece';
                $stockVal = isset($data['current_stock'])
                    ? (float) $data['current_stock']
                    : (isset($data['opening_stock']) ? (float) $data['opening_stock'] : 0.0);
                $data['current_stock'] = $stockVal;
                $data['minimum_stock'] = isset($data['minimum_stock']) ? (float) $data['minimum_stock'] : 5.0;
            }

            unset($data['opening_stock_grams'], $data['opening_stock_kg'], $data['opening_stock']);

            $product = Product::create($data);

            // Create initial inventory movement if opening stock > 0
            if ($product->current_stock > 0) {
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'movement_type' => MovementType::OPENING_STOCK,
                    'quantity_or_grams' => $product->current_stock,
                    'stock_before' => 0,
                    'stock_after' => $product->current_stock,
                    'reference_type' => Product::class,
                    'reference_id' => $product->id,
                    'user_id' => $userId,
                    'notes' => 'Initial opening stock',
                ]);
            }

            return $product;
        });
    }

    public function updateProduct(Product $product, array $data, ?int $userId = null): Product
    {
        return DB::transaction(function () use ($product, $data, $userId) {
            $oldBasePrice = (float) ($product->base_price ?? 0.00);
            $oldPurchasePrice = (float) ($product->purchase_price ?? 0.00);

            $mode = isset($data['selling_mode']) ? SellingMode::from($data['selling_mode']) : $product->selling_mode;

            if ($mode === SellingMode::WEIGHT) {
                if (isset($data['current_stock'])) {
                    $val = (float) $data['current_stock'];
                    $data['current_stock'] = $val >= 1000 ? $val : $val * 1000;
                } elseif (isset($data['opening_stock'])) {
                    $val = (float) $data['opening_stock'];
                    $data['current_stock'] = $val >= 1000 ? $val : $val * 1000;
                }
                if (isset($data['minimum_stock'])) {
                    $minVal = (float) $data['minimum_stock'];
                    $data['minimum_stock'] = $minVal >= 1000 ? $minVal : $minVal * 1000;
                }
            } else {
                if (isset($data['opening_stock']) && !isset($data['current_stock'])) {
                    $data['current_stock'] = (float) $data['opening_stock'];
                }
            }

            unset($data['opening_stock_grams'], $data['opening_stock_kg'], $data['opening_stock']);

            $product->update($data);

            // Log price changes if prices were modified
            $newBasePrice = (float) ($product->base_price ?? 0.00);
            $newPurchasePrice = (float) ($product->purchase_price ?? 0.00);

            if ($oldBasePrice !== $newBasePrice || $oldPurchasePrice !== $newPurchasePrice) {
                ProductPriceHistory::create([
                    'product_id' => $product->id,
                    'old_base_price' => $oldBasePrice,
                    'new_base_price' => $newBasePrice,
                    'old_purchase_price' => $oldPurchasePrice,
                    'new_purchase_price' => $newPurchasePrice,
                    'changed_by' => $userId,
                    'changed_at' => now(),
                ]);
            }

            return $product->fresh();
        });
    }

    public function deleteProduct(Product $product): bool
    {
        return (bool) $product->delete();
    }
}
