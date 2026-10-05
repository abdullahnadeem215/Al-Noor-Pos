<?php

namespace App\Services;

use App\Enums\LedgerType;
use App\Enums\MovementType;
use App\Enums\SaleStatus;
use App\Enums\SellingMode;
use App\Models\CreditLedger;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnService
{
    public function __construct(
        protected WeightCalculationService $weightService,
        protected InventoryService $inventoryService
    ) {}

    public function processReturn(array $data, User $user): SalesReturn
    {
        return DB::transaction(function () use ($data, $user) {
            $sale = Sale::where('id', $data['sale_id'])->lockForUpdate()->firstOrFail();

            $totalRefund = 0.0;
            $returnItemsData = [];

            foreach ($data['items'] as $itemInput) {
                $saleItem = SaleItem::where('id', $itemInput['sale_item_id'])
                    ->where('sale_id', $sale->id)
                    ->firstOrFail();

                $product = Product::where('id', $saleItem->product_id)->lockForUpdate()->firstOrFail();

                $refundAmount = 0.0;
                $quantity = null;
                $weightGrams = null;

                if ($saleItem->selling_mode === SellingMode::WEIGHT) {
                    $rawWeight = $itemInput['weight_grams'] ?? $itemInput['weight'];
                    $unit = $itemInput['weight_unit'] ?? 'gram';
                    $weightGrams = $this->weightService->normalizeToGrams($rawWeight, $unit);

                    if ($weightGrams > (float) $saleItem->weight_grams) {
                        throw ValidationException::withMessages([
                            'weight_grams' => ["Cannot return more weight ({$weightGrams}g) than sold ({$saleItem->weight_grams}g)."],
                        ]);
                    }

                    // Calculate refund using historical price snapshot
                    $refundAmount = $this->weightService->calculatePriceByWeight(
                        (float) $saleItem->unit_base_price_snapshot,
                        $weightGrams
                    );
                } else {
                    $quantity = (float) $itemInput['quantity'];

                    if ($quantity > (float) $saleItem->quantity) {
                        throw ValidationException::withMessages([
                            'quantity' => ["Cannot return more quantity ({$quantity}) than sold ({$saleItem->quantity})."],
                        ]);
                    }

                    // Calculate refund using historical price snapshot
                    $refundAmount = $this->weightService->calculateQuantityPrice(
                        (float) $saleItem->unit_base_price_snapshot,
                        $quantity
                    );
                }

                $returnItemsData[] = [
                    'sale_item' => $saleItem,
                    'product' => $product,
                    'quantity' => $quantity,
                    'weight_grams' => $weightGrams,
                    'refund_amount' => $refundAmount,
                ];

                $totalRefund += $refundAmount;
            }

            $totalRefund = round($totalRefund, 2);
            $returnNum = 'RET-' . date('Ymd') . '-' . rand(1000, 9999);

            $salesReturn = SalesReturn::create([
                'return_number' => $returnNum,
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'total_refund_amount' => $totalRefund,
                'refund_payment_method' => $data['refund_payment_method'] ?? 'cash',
                'reason' => $data['reason'] ?? null,
                'created_by' => $user->id,
            ]);

            foreach ($returnItemsData as $retItem) {
                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'sale_item_id' => $retItem['sale_item']->id,
                    'product_id' => $retItem['product']->id,
                    'quantity' => $retItem['quantity'],
                    'weight_grams' => $retItem['weight_grams'],
                    'refund_amount' => $retItem['refund_amount'],
                ]);

                // Re-add stock
                $delta = ($retItem['sale_item']->selling_mode === SellingMode::WEIGHT)
                    ? abs($retItem['weight_grams'])
                    : abs($retItem['quantity']);

                $this->inventoryService->adjustStock(
                    product: $retItem['product'],
                    delta: $delta,
                    movementType: MovementType::SALE_RETURN,
                    referenceType: SalesReturn::class,
                    referenceId: $salesReturn->id,
                    userId: $user->id,
                    notes: "Sales Return {$returnNum}"
                );
            }

            // Update sale status
            $sale->update(['sale_status' => SaleStatus::RETURNED]);

            // Handle credit ledger reduction if customer credit deduction chosen
            if (($data['refund_payment_method'] ?? 'cash') === 'credit_deduction' && $sale->customer_id) {
                $customer = Customer::where('id', $sale->customer_id)->lockForUpdate()->first();
                if ($customer) {
                    $newBalance = max(0.00, round((float) $customer->current_balance - $totalRefund, 2));
                    $customer->update(['current_balance' => $newBalance]);

                    CreditLedger::create([
                        'customer_id' => $customer->id,
                        'sale_id' => $sale->id,
                        'transaction_type' => LedgerType::CREDIT,
                        'amount' => $totalRefund,
                        'balance_after' => $newBalance,
                        'reference_number' => $returnNum,
                        'notes' => "Return refund deduction {$returnNum}",
                        'created_by' => $user->id,
                    ]);
                }
            }

            return $salesReturn->load(['items', 'sale', 'customer']);
        });
    }
}
