<?php

namespace App\Services;

use App\Enums\MovementType;
use App\Enums\PaymentStatus;
use App\Enums\SellingMode;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(
        protected WeightCalculationService $weightService,
        protected InventoryService $inventoryService
    ) {}

    public function createPurchase(array $data, ?User $user = null): Purchase
    {
        return DB::transaction(function () use ($data, $user) {
            $subtotal = 0.0;
            $itemsData = [];

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $unitPrice = (float) $item['unit_purchase_price'];

                $quantity = null;
                $weightGrams = null;
                $lineTotal = 0.0;

                if ($product->isWeightMode()) {
                    $rawWeight = $item['weight_grams'] ?? $item['weight'];
                    $unit = $item['weight_unit'] ?? 'gram';
                    $weightGrams = $this->weightService->normalizeToGrams($rawWeight, $unit);
                    $lineTotal = round(($weightGrams / 1000.0) * $unitPrice, 2);
                } else {
                    $quantity = (float) $item['quantity'];
                    $lineTotal = round($quantity * $unitPrice, 2);
                }

                $itemsData[] = [
                    'product' => $product,
                    'product_name_snapshot' => $product->name,
                    'selling_mode' => $product->selling_mode->value,
                    'quantity' => $quantity,
                    'weight_grams' => $weightGrams,
                    'unit_purchase_price' => $unitPrice,
                    'total_price' => $lineTotal,
                ];

                $subtotal += $lineTotal;
            }

            $subtotal = round($subtotal, 2);
            $total = $subtotal;

            $paidAmount = isset($data['paid_amount']) ? round((float) $data['paid_amount'], 2) : $total;
            $dueAmount = max(0.00, round($total - $paidAmount, 2));

            $paymentStatus = PaymentStatus::PAID;
            if ($dueAmount > 0) {
                $paymentStatus = ($paidAmount > 0) ? PaymentStatus::PARTIAL : PaymentStatus::UNPAID;
            }

            $refNum = $data['reference_number'] ?? 'PO-' . date('Ymd') . '-' . rand(1000, 9999);

            $purchase = Purchase::create([
                'reference_number' => $refNum,
                'supplier_id' => $data['supplier_id'] ?? null,
                'purchase_date' => $data['purchase_date'] ?? now(),
                'subtotal' => $subtotal,
                'total' => $total,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'status' => 'completed',
                'created_by' => $user?->id,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($itemsData as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product']->id,
                    'product_name_snapshot' => $item['product_name_snapshot'],
                    'selling_mode' => $item['selling_mode'],
                    'quantity' => $item['quantity'],
                    'weight_grams' => $item['weight_grams'],
                    'unit_purchase_price' => $item['unit_purchase_price'],
                    'total_price' => $item['total_price'],
                ]);

                // Increase stock
                $delta = ($item['selling_mode'] === SellingMode::WEIGHT->value)
                    ? abs($item['weight_grams'])
                    : abs($item['quantity']);

                $this->inventoryService->adjustStock(
                    product: $item['product'],
                    delta: $delta,
                    movementType: MovementType::PURCHASE,
                    referenceType: Purchase::class,
                    referenceId: $purchase->id,
                    userId: $user?->id,
                    notes: "Stock Purchase {$refNum}"
                );
            }

            // Update supplier balance if due > 0
            if ($dueAmount > 0 && !empty($data['supplier_id'])) {
                $supplier = Supplier::where('id', $data['supplier_id'])->lockForUpdate()->first();
                if ($supplier) {
                    $supplier->update(['current_balance' => round((float) $supplier->current_balance + $dueAmount, 2)]);
                }
            }

            return $purchase->load(['items', 'supplier', 'creator']);
        });
    }
}
