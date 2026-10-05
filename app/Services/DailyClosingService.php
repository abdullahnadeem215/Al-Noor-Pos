<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Models\CreditLedger;
use App\Models\DailyClosing;
use App\Models\Expense;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\SalesReturn;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DailyClosingService
{
    public function previewClosing(?string $date = null): array
    {
        $closingDate = $date ? Carbon::parse($date)->toDateString() : now()->toDateString();

        // Check if previous day closing exists to get opening cash
        $previousClosing = DailyClosing::where('closing_date', '<', $closingDate)
            ->latest('closing_date')
            ->first();

        $openingCash = $previousClosing ? (float) $previousClosing->actual_cash : 0.00;

        // Total Sales Amount
        $salesQuery = Sale::whereDate('created_at', $closingDate)->where('sale_status', '!=', 'cancelled');
        $totalSales = (float) ($salesQuery->sum('total') ?? 0.00);

        // Sales payments breakdown
        $cashSales = (float) (SalePayment::whereHas('sale', function ($q) use ($closingDate) {
            $q->whereDate('created_at', $closingDate)->where('sale_status', '!=', 'cancelled');
        })->where('payment_method', PaymentMethod::CASH->value)->sum('amount') ?? 0.00);

        $creditSales = (float) ($salesQuery->sum('due_amount') ?? 0.00);
        $otherSales = max(0.00, round($totalSales - ($cashSales + $creditSales), 2));

        // Customer credit payments received today in cash
        $customerPayments = (float) (CreditLedger::whereDate('created_at', $closingDate)
            ->where('transaction_type', 'credit')
            ->sum('amount') ?? 0.00);

        // Cash expenses today
        $expenses = (float) (Expense::whereDate('expense_date', $closingDate)
            ->where('payment_method', PaymentMethod::CASH->value)
            ->sum('amount') ?? 0.00);

        // Cash refunds today
        $refunds = (float) (SalesReturn::whereDate('created_at', $closingDate)
            ->where('refund_payment_method', 'cash')
            ->sum('total_refund_amount') ?? 0.00);

        $expectedCash = round($openingCash + $cashSales + $customerPayments - $expenses - $refunds, 2);

        return [
            'closing_date' => $closingDate,
            'opening_cash' => round($openingCash, 2),
            'total_sales_amount' => round($totalSales, 2),
            'cash_sales_amount' => round($cashSales, 2),
            'credit_sales_amount' => round($creditSales, 2),
            'other_sales_amount' => round($otherSales, 2),
            'total_customer_payments' => round($customerPayments, 2),
            'total_expenses' => round($expenses, 2),
            'total_refunds' => round($refunds, 2),
            'expected_cash' => $expectedCash,
        ];
    }

    public function performClosing(array $data, User $user): DailyClosing
    {
        $date = $data['closing_date'] ?? now()->toDateString();

        $existing = DailyClosing::where('closing_date', $date)->first();
        if ($existing && !$existing->is_reopened) {
            throw ValidationException::withMessages([
                'closing_date' => ["Daily closing for date {$date} has already been completed."],
            ]);
        }

        $preview = $this->previewClosing($date);
        $actualCash = round((float) ($data['actual_cash'] ?? $preview['expected_cash']), 2);
        $difference = round($actualCash - $preview['expected_cash'], 2);

        return DB::transaction(function () use ($existing, $preview, $actualCash, $difference, $data, $user) {
            $closingData = array_merge($preview, [
                'opening_cash' => $data['opening_cash'] ?? $preview['opening_cash'],
                'actual_cash' => $actualCash,
                'difference' => $difference,
                'notes' => $data['notes'] ?? null,
                'closed_by' => $user->id,
                'is_reopened' => false,
                'closed_at' => now(),
            ]);

            if ($existing) {
                $existing->update($closingData);
                return $existing->fresh();
            }

            return DailyClosing::create($closingData);
        });
    }

    public function reopenClosing(DailyClosing $closing, User $user): DailyClosing
    {
        $closing->update(['is_reopened' => true]);

        return $closing->fresh();
    }
}
