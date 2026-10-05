<?php

namespace Tests\Feature;

use App\Enums\SellingMode;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriticalBusinessScenariosTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;
    protected Category $category;
    protected SaleService $saleService;
    protected ProductService $productService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::factory()->create([
            'role' => UserRole::CASHIER,
            'status' => 'active',
        ]);

        $this->category = Category::create([
            'name' => 'General Store',
            'status' => 'active',
        ]);

        $this->saleService = app(SaleService::class);
        $this->productService = app(ProductService::class);
    }

    /**
     * Scenario 1:
     * Product: Sugar @ PKR 180/kg
     * Customer asks: 1 pao (250g)
     * System: 250g, Total PKR 45
     */
    public function test_scenario_1_sugar_1_pao_calculates_250g_and_45_pkr(): void
    {
        $sugar = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Sugar',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 180.00,
            'opening_stock_kg' => 50,
        ], $this->cashier->id);

        $calculation = $this->saleService->calculateCart([
            [
                'product_id' => $sugar->id,
                'weight' => 1,
                'weight_unit' => 'pao',
            ]
        ]);

        $this->assertEquals(250.0, $calculation['items'][0]['weight_grams']);
        $this->assertEquals(45.00, $calculation['items'][0]['subtotal']);
        $this->assertEquals(45.00, $calculation['total']);
    }

    /**
     * Scenario 2:
     * Product: Sugar @ PKR 180/kg
     * Customer asks: PKR 100 ki sugar
     * System: 555.556g, Total PKR 100
     */
    public function test_scenario_2_sugar_100_pkr_amount_calculates_555_point_556_grams(): void
    {
        $sugar = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Sugar',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 180.00,
            'opening_stock_kg' => 50,
        ], $this->cashier->id);

        $calculation = $this->saleService->calculateCart([
            [
                'product_id' => $sugar->id,
                'sale_mode' => 'weight',
                'amount' => 100.00,
            ]
        ]);

        $this->assertEquals(555.556, $calculation['items'][0]['weight_grams']);
        $this->assertEquals(100.00, $calculation['items'][0]['subtotal']);
        $this->assertEquals(100.00, $calculation['total']);
    }

    /**
     * Scenario 3:
     * Product: Toothpaste @ PKR 180/piece
     * Customer asks: 3 pieces
     * System: 3 x 180 = PKR 540
     */
    public function test_scenario_3_toothpaste_3_pieces_calculates_540_pkr(): void
    {
        $toothpaste = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Toothpaste',
            'selling_mode' => SellingMode::QUANTITY->value,
            'base_unit' => 'piece',
            'base_price' => 180.00,
            'opening_stock' => 50,
        ], $this->cashier->id);

        $calculation = $this->saleService->calculateCart([
            [
                'product_id' => $toothpaste->id,
                'sale_mode' => 'quantity',
                'quantity' => 3,
            ]
        ]);

        $this->assertEquals(3.0, $calculation['items'][0]['quantity']);
        $this->assertEquals(540.00, $calculation['items'][0]['subtotal']);
        $this->assertEquals(540.00, $calculation['total']);
    }

    /**
     * Scenario 4:
     * Sugar stock: 10kg (10,000g)
     * Customer buys: 250g
     * Remaining stock: 9.75kg (9,750g)
     */
    public function test_scenario_4_sugar_stock_deduction_10kg_minus_250g_leaves_9_point_75kg(): void
    {
        $sugar = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Sugar',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 180.00,
            'opening_stock_kg' => 10, // 10,000g
        ], $this->cashier->id);

        $this->assertEquals(10000.0, (float) $sugar->current_stock);

        $this->saleService->finalizeSale([
            'items' => [
                [
                    'product_id' => $sugar->id,
                    'weight' => 250,
                    'weight_unit' => 'gram',
                ]
            ],
            'paid_amount' => 45.00,
        ], $this->cashier);

        $sugar->refresh();
        $this->assertEquals(9750.0, (float) $sugar->current_stock);
    }

    /**
     * Scenario 5:
     * Toothpaste stock: 10 pieces
     * Customer buys: 3
     * Remaining stock: 7 pieces
     */
    public function test_scenario_5_toothpaste_stock_deduction_10_minus_3_leaves_7(): void
    {
        $toothpaste = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Toothpaste',
            'selling_mode' => SellingMode::QUANTITY->value,
            'base_unit' => 'piece',
            'base_price' => 180.00,
            'opening_stock' => 10,
        ], $this->cashier->id);

        $this->assertEquals(10.0, (float) $toothpaste->current_stock);

        $this->saleService->finalizeSale([
            'items' => [
                [
                    'product_id' => $toothpaste->id,
                    'quantity' => 3,
                ]
            ],
            'paid_amount' => 540.00,
        ], $this->cashier);

        $toothpaste->refresh();
        $this->assertEquals(7.0, (float) $toothpaste->current_stock);
    }

    /**
     * Scenario 6:
     * Sugar price changes: 180 -> 200
     * Old invoice must still show: 180
     * New sale must use: 200
     */
    public function test_scenario_6_price_change_preserves_historical_invoice_snapshot(): void
    {
        $sugar = $this->productService->createProduct([
            'category_id' => $this->category->id,
            'name' => 'Sugar',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 180.00,
            'opening_stock_kg' => 50,
        ], $this->cashier->id);

        // First sale @ 180/kg
        $oldSale = $this->saleService->finalizeSale([
            'items' => [
                [
                    'product_id' => $sugar->id,
                    'weight' => 1,
                    'weight_unit' => 'kg',
                ]
            ],
            'paid_amount' => 180.00,
        ], $this->cashier);

        $this->assertEquals(180.00, (float) $oldSale->items->first()->unit_base_price_snapshot);
        $this->assertEquals(180.00, (float) $oldSale->total);

        // Update product price to 200/kg
        $this->productService->updateProduct($sugar, ['base_price' => 200.00], $this->cashier->id);

        // Second sale @ 200/kg
        $newSale = $this->saleService->finalizeSale([
            'items' => [
                [
                    'product_id' => $sugar->id,
                    'weight' => 1,
                    'weight_unit' => 'kg',
                ]
            ],
            'paid_amount' => 200.00,
        ], $this->cashier);

        $this->assertEquals(200.00, (float) $newSale->items->first()->unit_base_price_snapshot);
        $this->assertEquals(200.00, (float) $newSale->total);

        // Verify old sale remains 180.00
        $oldSale->refresh();
        $this->assertEquals(180.00, (float) $oldSale->items->first()->unit_base_price_snapshot);
        $this->assertEquals(180.00, (float) $oldSale->total);
    }
}
