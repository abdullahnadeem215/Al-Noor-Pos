<?php

namespace Database\Seeders;

use App\Enums\SellingMode;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductService;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner@alnoormart.com')->first();
        $productService = app(ProductService::class);

        $daalCat = Category::where('name', 'Daal')->first();
        $chawalCat = Category::where('name', 'Chawal')->first();
        $sugarCat = Category::where('name', 'Sugar')->first();
        $flourCat = Category::where('name', 'Flour')->first();
        $personalCat = Category::where('name', 'Personal Care')->first();
        $biscuitCat = Category::where('name', 'Biscuits')->first();

        // 1. Sugar (Weight Mode) - PKR 180 / kg
        $productService->createProduct([
            'category_id' => $sugarCat->id,
            'name' => 'Sugar (Chini)',
            'sku' => 'SUGAR-001',
            'barcode' => '896000000001',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 180.00,
            'purchase_price' => 160.00,
            'opening_stock_grams' => 50000.00, // 50kg in grams
            'minimum_stock' => 5000.00, // 5kg alert
            'status' => 'active',
        ], $owner?->id);

        // 2. Basmati Rice (Weight Mode) - PKR 320 / kg
        $productService->createProduct([
            'category_id' => $chawalCat->id,
            'name' => 'Super Kernel Basmati Rice',
            'sku' => 'RICE-001',
            'barcode' => '896000000002',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 320.00,
            'purchase_price' => 280.00,
            'opening_stock_grams' => 100000.00, // 100kg
            'minimum_stock' => 10000.00,
            'status' => 'active',
        ], $owner?->id);

        // 3. Masoor Daal (Weight Mode) - PKR 280 / kg
        $productService->createProduct([
            'category_id' => $daalCat->id,
            'name' => 'Masoor Daal',
            'sku' => 'DAAL-001',
            'barcode' => '896000000003',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 280.00,
            'purchase_price' => 240.00,
            'opening_stock_grams' => 30000.00, // 30kg
            'minimum_stock' => 3000.00,
            'status' => 'active',
        ], $owner?->id);

        // 4. Chakki Atta / Flour (Weight Mode) - PKR 140 / kg
        $productService->createProduct([
            'category_id' => $flourCat->id,
            'name' => 'Chakki Whole Wheat Flour',
            'sku' => 'FLOUR-001',
            'barcode' => '896000000004',
            'selling_mode' => SellingMode::WEIGHT->value,
            'base_unit' => 'kg',
            'base_price' => 140.00,
            'purchase_price' => 120.00,
            'opening_stock_grams' => 200000.00, // 200kg
            'minimum_stock' => 20000.00,
            'status' => 'active',
        ], $owner?->id);

        // 5. Toothpaste (Quantity Mode) - PKR 180 / piece
        $productService->createProduct([
            'category_id' => $personalCat->id,
            'name' => 'Colgate Toothpaste 140g',
            'sku' => 'TOOTHPASTE-001',
            'barcode' => '896000000005',
            'selling_mode' => SellingMode::QUANTITY->value,
            'base_unit' => 'piece',
            'stock_unit' => 'piece',
            'base_price' => 180.00,
            'purchase_price' => 140.00,
            'opening_stock' => 100.00, // 100 pieces
            'minimum_stock' => 10.00,
            'status' => 'active',
        ], $owner?->id);

        // 6. Lux Soap (Quantity Mode) - PKR 120 / piece
        $productService->createProduct([
            'category_id' => $personalCat->id,
            'name' => 'Lux Beauty Soap 120g',
            'sku' => 'SOAP-001',
            'barcode' => '896000000006',
            'selling_mode' => SellingMode::QUANTITY->value,
            'base_unit' => 'piece',
            'stock_unit' => 'piece',
            'base_price' => 120.00,
            'purchase_price' => 95.00,
            'opening_stock' => 150.00,
            'minimum_stock' => 15.00,
            'status' => 'active',
        ], $owner?->id);

        // 7. Biscuits Pack (Quantity Mode) - PKR 50 / pack
        $productService->createProduct([
            'category_id' => $biscuitCat->id,
            'name' => 'Peek Freans Sooper Pack',
            'sku' => 'BISCUIT-001',
            'barcode' => '896000000007',
            'selling_mode' => SellingMode::QUANTITY->value,
            'base_unit' => 'pack',
            'stock_unit' => 'pack',
            'base_price' => 50.00,
            'purchase_price' => 40.00,
            'opening_stock' => 200.00,
            'minimum_stock' => 20.00,
            'status' => 'active',
        ], $owner?->id);
    }
}
