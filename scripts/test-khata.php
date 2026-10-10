<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\CreditLedger;
use App\Models\User;
use App\Services\SaleService;
use App\Services\CreditLedgerService;
use Illuminate\Support\Facades\DB;

echo "=== STARTING JEXRON KHATA END-TO-END VERIFICATION ===\n\n";

DB::beginTransaction();

try {
    // 1. Setup Cashier
    $cashier = User::firstOrCreate(['email' => 'cashier@test.com'], [
        'name' => 'Test Cashier',
        'password' => bcrypt('password'),
        'role' => 'cashier',
    ]);

    // 2. Setup Category & Product: Sugar (Purchase: 170, Wholesale: 180, Selling: 190, Stock: 100 KG)
    $category = Category::firstOrCreate(['slug' => 'test-grocery'], ['name' => 'Test Grocery', 'status' => 'active']);

    $sugar = Product::create([
        'category_id' => $category->id,
        'name' => 'Sugar Test ' . uniqid(),
        'sku' => 'SGR-' . rand(1000, 9999),
        'selling_mode' => 'weight',
        'stock_unit' => 'gram',
        'base_unit' => 'kg',
        'purchase_price' => 170.00,
        'wholesale_price' => 180.00,
        'base_price' => 190.00,
        'current_stock' => 100000.000,
        'minimum_stock' => 5000.000,
        'status' => 'active',
    ]);

    echo "[1] Product Created: {$sugar->name} | Purchase: Rs.170 | Wholesale: Rs.180 | Selling: Rs.190 | Stock: 100 KG\n";

    // 3. Setup Customer: Muhammad Ali
    $customer = Customer::create([
        'name' => 'Muhammad Ali Test ' . uniqid(),
        'phone' => '03001234567',
        'opening_balance' => 0.00,
        'current_balance' => 0.00,
        'status' => 'active',
    ]);

    echo "[2] Customer Created: {$customer->name} | Initial Balance: Rs.0\n";

    // 4. Action: Create Khaata invoice (10 KG @ Rs.190/KG = Rs.1,900)
    $saleService = app(SaleService::class);
    $invoice = $saleService->finalizeSale([
        'customer_id' => $customer->id,
        'paid_amount' => 0.00,
        'items' => [
            [
                'product_id' => $sugar->id,
                'sale_mode' => 'weight',
                'weight_grams' => 10000,
                'unit_price' => 190.00,
            ],
        ],
    ], $cashier);

    echo "[3] Khaata Invoice Finalized: {$invoice->invoice_number} | Total: Rs.{$invoice->total}\n";

    // Assert Invoice & Items in DB
    assert(str_starts_with($invoice->invoice_number, 'KH-'), 'Invoice number must start with KH-');
    $item = SaleItem::where('sale_id', $invoice->id)->first();
    assert($item->unit_base_price_snapshot == 190.00, 'Price snapshot must be 190.00');
    assert($item->total == 1900.00, 'Line total must be 1900.00');

    // Assert Customer Ledger & Balance
    $customer->refresh();
    assert($customer->current_balance == 1900.00, 'Customer balance must be 1900.00');

    // Assert Stock Movement
    $sugar->refresh();
    assert($sugar->current_stock == 90000.000, 'Stock must be 90 KG (90,000 grams)');
    echo "[4] Verification Passed: Customer balance = Rs.1,900 | Remaining Stock = 90 KG\n";

    // 5. Change Sugar selling price from Rs.190 -> Rs.200
    $sugar->update(['base_price' => 200.00]);
    echo "[5] Updated Sugar Selling Price in Master Database: Rs.190 -> Rs.200\n";

    // 6. Re-open OLD invoice & verify immutability
    $oldInvoice = Sale::with('items')->find($invoice->id);
    $oldItem = $oldInvoice->items->first();
    assert($oldItem->unit_base_price_snapshot == 190.00, 'OLD Invoice item unit price MUST remain Rs.190');
    assert($oldInvoice->total == 1900.00, 'OLD Invoice total MUST remain Rs.1,900');
    echo "[6] Historical Price Immutability Passed: OLD Invoice STILL shows Rs.190 / Rs.1,900!\n";

    // 7. Payment Test: Record Rs. 1,000 payment
    $creditService = app(CreditLedgerService::class);
    $payment = $creditService->recordPayment($customer, 1000.00, null, 'Partial payment', $cashier);

    echo "[7] Payment Recorded: Reference {$payment->reference_number} | Amount: Rs.1,000\n";
    assert(str_starts_with($payment->reference_number, 'PAY-'), 'Payment reference must start with PAY-');

    $customer->refresh();
    assert($customer->current_balance == 900.00, 'Customer remaining balance must be Rs.900');
    echo "[8] Payment Verification Passed: Remaining Customer Balance = Rs.900\n";

    DB::rollBack();
    echo "\n=== ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY (100%) ===\n";
} catch (\Throwable $e) {
    DB::rollBack();
    echo "\n[ERROR] Verification failed: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
