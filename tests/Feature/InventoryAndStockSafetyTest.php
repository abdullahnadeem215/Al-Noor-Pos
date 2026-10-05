<?php

namespace Tests\Feature;

use App\Enums\SellingMode;
use App\Enums\UserRole;
use App\Exceptions\InsufficientStockException;
use App\Models\Category;
use App\Models\Customer;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\ProductService;
use App\Services\PurchaseService;
use App\Services\ReturnService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryAndStockSafetyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;
    protected ProductService $productService;
    protected SaleService $saleService;
    protected PurchaseService $purchaseService;
    protected ReturnService $returnService;
    protected InventoryService $inventoryService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => UserRole::OWNER,
            'status' => 'active',
        ]);

        $this->category = Category::create([
            'name' => 'Groceries',
            'status' => 'active',
        ]);

        $this->productService = app(ProductService::class);
        $this->saleService = app(SaleService::class);
        $this->purchaseService = app(PurchaseService::class);
        $this->returnService = app(ReturnService::class);
        $this->inventoryService = app(InventoryService::class);
    }

    public function test_purchase_increases_stock_and_sale_decreases_stock_and_return_restores_stock(): void
    {
        $product = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Basmati Rice',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 300.00,
            'opening_stock_kg' => 10.0, // 10,000g
        ], $this->user->id);

        $this->assertEquals(10000.0, (float) $product->current_stock);

        // 1. Purchase 5kg
        $this->purchaseService->createPurchase([
            'items' => [
                [
                    'product_id' => $product->id,
                    'weight' => 5,
                    'weight_unit' => 'kg',
                    'unit_purchase_price' => 250.00,
                ]
            ],
            'paid_amount' => 1250.00,
        ], $this->user);

        $product->refresh();
        $this->assertEquals(15000.0, (float) $product->current_stock); // 15kg

        // 2. Sale 2kg
        $sale = $this->saleService->finalizeSale([
            'items' => [
                [
                    'product_id' => $product->id,
                    'weight' => 2,
                    'weight_unit' => 'kg',
                ]
            ],
            'paid_amount' => 600.00,
        ], $this->user);

        $product->refresh();
        $this->assertEquals(13000.0, (float) $product->current_stock); // 13kg

        // 3. Return 1kg
        $this->returnService->processReturn([
            'sale_id' => $sale->id,
            'items' => [
                [
                    'sale_item_id' => $sale->items->first()->id,
                    'weight' => 1,
                    'weight_unit' => 'kg',
                ]
            ]
        ], $this->user);

        $product->refresh();
        $this->assertEquals(14000.0, (float) $product->current_stock); // 14kg
    }

    public function test_insufficient_stock_is_rejected_when_negative_stock_disallowed(): void
    {
        $product = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Soap',
            'selling_mode' => SellingMode::QUANTITY->value,
            'base_unit' => 'piece',
            'base_price' => 100.00,
            'opening_stock' => 5, // only 5 pieces
        ], $this->user->id);

        $this->expectException(InsufficientStockException::class);

        $this->saleService->finalizeSale([
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10, // attempting to sell 10
                ]
            ],
            'paid_amount' => 1000.00,
        ], $this->user);
    }
}
