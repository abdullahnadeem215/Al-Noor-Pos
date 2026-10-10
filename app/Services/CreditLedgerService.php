<?php

namespace App\Services;

use App\Enums\LedgerType;
use App\Models\CreditLedger;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreditLedgerService
{
    public function recordPayment(Customer $customer, float $amount, ?string $reference = null, ?string $notes = null, ?User $user = null): CreditLedger
    {
        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => ['Payment amount must be greater than zero.'],
            ]);
        }

        return DB::transaction(function () use ($customer, $amount, $reference, $notes, $user) {
            $lockedCustomer = Customer::where('id', $customer->id)->lockForUpdate()->firstOrFail();

            $currentBalance = (float) $lockedCustomer->current_balance;

            if ($currentBalance <= 0) {
                throw ValidationException::withMessages([
                    'amount' => ['Customer has no outstanding balance to pay.'],
                ]);
            }

            if ($amount > $currentBalance) {
                throw ValidationException::withMessages([
                    'amount' => ["Payment amount (Rs. {$amount}) exceeds customer's outstanding balance (Rs. {$currentBalance})."],
                ]);
            }

            $newBalance = max(0.00, round($currentBalance - $amount, 2));

            $lockedCustomer->update(['current_balance' => $newBalance]);

            if (empty($reference)) {
                $todayCount = CreditLedger::where('transaction_type', LedgerType::CREDIT)
                    ->whereDate('created_at', now()->toDateString())
                    ->count() + 1;
                $reference = sprintf('PAY-%s-%04d', date('Ymd'), $todayCount);
            }

            return CreditLedger::create([
                'customer_id' => $lockedCustomer->id,
                'transaction_type' => LedgerType::CREDIT,
                'amount' => round($amount, 2),
                'balance_after' => $newBalance,
                'reference_number' => $reference,
                'notes' => $notes ?? 'Customer balance payment',
                'created_by' => $user?->id,
            ]);
        });
    }

    public function getCustomerLedger(Customer $customer, array $filters = []): LengthAwarePaginator
    {
        $query = CreditLedger::query()
            ->where('customer_id', $customer->id)
            ->with(['sale.items', 'creator']);

        if (!empty($filters['date_filter'])) {
            match ($filters['date_filter']) {
                'today' => $query->whereDate('created_at', now()->toDateString()),
                'yesterday' => $query->whereDate('created_at', now()->subDay()->toDateString()),
                'this_week' => $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]),
                'this_month' => $query->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]),
                default => null,
            };
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('created_at', [$filters['start_date'] . ' 00:00:00', $filters['end_date'] . ' 23:59:59']);
        }

        return $query->latest('id')->paginate($filters['per_page'] ?? 20);
    }
}
