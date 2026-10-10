<?php

namespace App\Services;

use App\Enums\LedgerType;
use App\Enums\MovementType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use App\Enums\SellingMode;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\InvalidSellingModeException;
use App\Models\CreditLedger;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(
        protected WeightCalculationService $weightService,
        protected InventoryService $inventoryService
    ) {}

    /**
     * Preview / Calculate cart total without persisting to database.
     */
    public function calculateCart(array $items): array
    {
        $calculatedItems = [];
        $subtotal = 0.0;

        foreach ($items as $itemData) {
            $productId = $itemData['product_id'];
            $product = Product::with('category')->findOrFail($productId);

            $saleMode = $itemData['sale_mode'] ?? $product->selling_mode->value;

            // Validate selling mode match
            if ($saleMode !== $product->selling_mode->value) {
                throw new InvalidSellingModeException(
                    "Product '{$product->name}' uses selling mode [{$product->selling_mode->value}], cannot process sale as [{$saleMode}]."
                );
            }

            $unitBasePrice = isset($itemData['unit_price']) && (float) $itemData['unit_price'] > 0
                ? (float) $itemData['unit_price']
                : (float) $product->base_price;

            $itemSubtotal = 0.0;
            $quantity = null;
            $weightGrams = null;

            if ($product->isWeightMode()) {
                if (isset($itemData['amount']) && $itemData['amount'] > 0) {
                    // Sale by monetary amount (e.g., PKR 100 ki sugar @ PKR 180/kg => 555.556g)
                    $calc = $this->weightService->calculateWeightByAmount(
                        $unitBasePrice,
                        (float) $itemData['amount']
                    );
                    $weightGrams = $calc['weight_grams'];
                    $itemSubtotal = $calc['amount'];
                } elseif (isset($itemData['weight_grams']) || isset($itemData['weight'])) {
                    $rawWeight = $itemData['weight_grams'] ?? $itemData['weight'];
                    $unit = $itemData['weight_unit'] ?? 'gram';
                    $weightGrams = $this->weightService->normalizeToGrams($rawWeight, $unit);
                    $itemSubtotal = $this->weightService->calculatePriceByWeight(
                        $unitBasePrice,
                        $weightGrams
                    );
                } else {
                    throw new InvalidSellingModeException(
                        "Weight product '{$product->name}' requires either 'weight_grams' (or weight/unit) or 'amount'."
                    );
                }
            } else {
                // Quantity mode
                if (!isset($itemData['quantity']) || (float) $itemData['quantity'] <= 0) {
                    throw new InvalidSellingModeException(
                        "Quantity product '{$product->name}' requires a positive 'quantity'."
                    );
                }
                $quantity = (float) $itemData['quantity'];
                $itemSubtotal = $this->weightService->calculateQuantityPrice(
                    $unitBasePrice,
                    $quantity
                );
            }

            $calculatedItems[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'sku' => $product->sku,
                'unit' => $product->base_unit ?? $product->stock_unit,
                'selling_mode' => $product->selling_mode->value,
                'unit_base_price' => $unitBasePrice,
                'quantity' => $quantity,
                'weight_grams' => $weightGrams,
                'subtotal' => $itemSubtotal,
                'total' => $itemSubtotal,
            ];

            $subtotal += $itemSubtotal;
        }

        $subtotal = round($subtotal, 2);

        return [
            'items' => $calculatedItems,
            'subtotal' => $subtotal,
            'total' => $subtotal, // Total = Subtotal (Discount & Tax excluded per directive)
        ];
    }

    /**
     * Finalize sale atomically within DB transaction.
     */
    public function finalizeSale(array $data, User $cashier): Sale
    {
        // Idempotency check
        if (!empty($data['idempotency_key'])) {
            $existingSale = Sale::where('idempotency_key', $data['idempotency_key'])->first();
            if ($existingSale) {
                return $existingSale->load(['items', 'payments', 'customer', 'cashier']);
            }
        }

        return DB::transaction(function () use ($data, $cashier) {
            // Calculate cart authoritative totals
            $calculation = $this->calculateCart($data['items']);

            $subtotal = $calculation['subtotal'];
            $total = $calculation['total'];

            $paidAmount = isset($data['paid_amount']) ? round((float) $data['paid_amount'], 2) : $total;
            $dueAmount = max(0.00, round($total - $paidAmount, 2));

            $paymentStatus = PaymentStatus::PAID;
            if ($dueAmount > 0) {
                $paymentStatus = ($paidAmount > 0) ? PaymentStatus::PARTIAL : PaymentStatus::CREDIT;
            }

            // Customer check if credit/due
            $customerId = $data['customer_id'] ?? null;
            if ($dueAmount > 0 && !$customerId) {
                throw new InvalidSellingModeException("A customer must be specified for sales with due/credit balance.");
            }

            $invoiceNumber = $this->generateInvoiceNumber();

            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'idempotency_key' => $data['idempotency_key'] ?? null,
                'customer_id' => $customerId,
                'subtotal' => $subtotal,
                'total' => $total,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'sale_status' => SaleStatus::COMPLETED,
                'cashier_id' => $cashier->id,
                'notes' => $data['notes'] ?? null,
            ]);

            // Save items and deduct stock
            foreach ($calculation['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'product_name_snapshot' => $item['product_name'],
                    'sku_snapshot' => $item['sku'],
                    'unit_snapshot' => $item['unit'],
                    'selling_mode' => $item['selling_mode'],
                    'unit_base_price_snapshot' => $item['unit_base_price'],
                    'quantity' => $item['quantity'],
                    'weight_grams' => $item['weight_grams'],
                    'subtotal' => $item['subtotal'],
                    'total' => $item['total'],
                ]);

                $product = Product::where('id', $item['product_id'])->lockForUpdate()->firstOrFail();

                $delta = ($item['selling_mode'] === SellingMode::WEIGHT->value)
                    ? -abs($item['weight_grams'])
                    : -abs($item['quantity']);

                $this->inventoryService->adjustStock(
                    product: $product,
                    delta: $delta,
                    movementType: MovementType::SALE,
                    referenceType: Sale::class,
                    referenceId: $sale->id,
                    userId: $cashier->id,
                    notes: "Sale Invoice {$invoiceNumber}"
                );
            }

            // Save payments
            $payments = $data['payments'] ?? [
                [
                    'payment_method' => PaymentMethod::CASH->value,
                    'amount' => $paidAmount,
                ]
            ];

            foreach ($payments as $pay) {
                if ((float) $pay['amount'] > 0) {
                    SalePayment::create([
                        'sale_id' => $sale->id,
                        'payment_method' => $pay['payment_method'],
                        'amount' => round((float) $pay['amount'], 2),
                        'reference_number' => $pay['reference_number'] ?? null,
                        'received_by' => $cashier->id,
                    ]);
                }
            }

            // Customer ledger update if due > 0
            if ($dueAmount > 0 && $customerId) {
                $customer = Customer::where('id', $customerId)->lockForUpdate()->firstOrFail();
                $newBalance = round((float) $customer->current_balance + $dueAmount, 2);

                $customer->update(['current_balance' => $newBalance]);

                CreditLedger::create([
                    'customer_id' => $customer->id,
                    'sale_id' => $sale->id,
                    'transaction_type' => LedgerType::DEBIT,
                    'amount' => $dueAmount,
                    'balance_after' => $newBalance,
                    'reference_number' => $invoiceNumber,
                    'notes' => "Unpaid balance from sale {$invoiceNumber}",
                    'created_by' => $cashier->id,
                ]);
            }

            return $sale->load(['items', 'payments', 'customer', 'cashier']);
        });
    }

    protected function generateInvoiceNumber(): string
    {
        $dateStr = date('Ymd');
        $countToday = Sale::whereDate('created_at', now()->toDateString())->count() + 1;

        return sprintf('KH-%s-%04d', $dateStr, $countToday);
    }
}
