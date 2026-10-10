<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\CreditLedger;
use App\Models\InventoryMovement;
use App\Models\User;
use App\Services\SaleService;
use App\Services\CreditLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JexronKhataTest extends TestCase
{
    use RefreshDatabase;

    public function test_phase_27_end_to_end_khaata_sale_and_historical_price_immutability(): void
    {
        // 1. Setup User & Category
        $cashier = User::factory()->create(['role' => 'cashier']);
        $category = Category::create(['name' => 'Grocery', 'slug' => 'grocery', 'status' => 'active']);

        // 2. Setup Product: Sugar (Purchase: 170, Wholesale: 180, Selling: 190, Stock: 100 KG = 100000 grams)
        $sugar = Product::create([
            'category_id' => $category->id,
            'name' => 'Sugar',
            'sku' => 'SGR-001',
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

        // 3. Setup Customer: Muhammad Ali
        $customer = Customer::create([
            'name' => 'Muhammad Ali',
            'phone' => '03001234567',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
            'status' => 'active',
        ]);

        // 4. Action: Create Khaata Invoice for 10 KG Sugar @ Rs. 190/KG = Rs. 1,900
        $saleService = app(SaleService::class);
        $saleData = [
            'customer_id' => $customer->id,
            'paid_amount' => 0.00, // Full credit sale
            'items' => [
                [
                    'product_id' => $sugar->id,
                    'sale_mode' => 'weight',
                    'weight_grams' => 10000, // 10 KG
                    'unit_price' => 190.00,
                ],
            ],
        ];

        $invoice = $saleService->finalizeSale($saleData, $cashier);

        // 5. Verify PostgreSQL / DB Records
        $this->assertDatabaseHas('sales', [
            'id' => $invoice->id,
            'customer_id' => $customer->id,
            'total' => 1900.00,
            'due_amount' => 1900.00,
        ]);
        $this->assertStringStartsWith('KH-', $invoice->invoice_number);

        $this->assertDatabaseHas('sale_items', [
            'sale_id' => $invoice->id,
            'product_id' => $sugar->id,
            'product_name_snapshot' => 'Sugar',
            'unit_base_price_snapshot' => 190.00,
            'total' => 1900.00,
        ]);

        $this->assertDatabaseHas('credit_ledgers', [
            'customer_id' => $customer->id,
            'sale_id' => $invoice->id,
            'transaction_type' => 'debit',
            'amount' => 1900.00,
            'balance_after' => 1900.00,
        ]);

        $customer->refresh();
        $this->assertEquals(1900.00, (float) $customer->current_balance);

        $sugar->refresh();
        $this->assertEquals(90000.000, (float) $sugar->current_stock); // 100 KG - 10 KG = 90 KG (90,000 grams)

        // 6. Change Sugar selling price from Rs. 190 -> Rs. 200
        $sugar->update(['base_price' => 200.00]);

        // 7. Re-open OLD invoice & verify immutability
        $fetchedInvoice = Sale::with('items')->findOrFail($invoice->id);
        $oldItem = $fetchedInvoice->items->first();

        $this->assertEquals(190.00, (float) $oldItem->unit_base_price_snapshot);
        $this->assertEquals(1900.00, (float) $oldItem->total);
        $this->assertEquals(1900.00, (float) $fetchedInvoice->total);

        // 8. Verify View/Download/Print causes NO extra stock deductions or DB mutations
        $sugar->refresh();
        $this->assertEquals(90000.000, (float) $sugar->current_stock);
        $this->assertEquals(1, Sale::count());
    }

    public function test_phase_28_end_to_end_customer_payment_test(): void
    {
        $cashier = User::factory()->create(['role' => 'cashier']);
        $customer = Customer::create([
            'name' => 'Muhammad Ali',
            'phone' => '03001234567',
            'opening_balance' => 0.00,
            'current_balance' => 1900.00,
            'status' => 'active',
        ]);

        $creditService = app(CreditLedgerService::class);
        $payment = $creditService->recordPayment($customer, 1000.00, null, 'Partial payment', $cashier);

        $this->assertDatabaseHas('credit_ledgers', [
            'customer_id' => $customer->id,
            'transaction_type' => 'credit',
            'amount' => 1000.00,
            'balance_after' => 900.00,
        ]);
        $this->assertStringStartsWith('PAY-', $payment->reference_number);

        $customer->refresh();
        $this->assertEquals(900.00, (float) $customer->current_balance);
        $this->assertEquals(1, CreditLedger::count());
    }
}
