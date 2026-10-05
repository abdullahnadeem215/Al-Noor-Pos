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
            $newBalance = round($currentBalance - $amount, 2);

            $lockedCustomer->update(['current_balance' => $newBalance]);

            return CreditLedger::create([
                'customer_id' => $lockedCustomer->id,
                'transaction_type' => LedgerType::CREDIT,
                'amount' => round($amount, 2),
                'balance_after' => $newBalance,
                'reference_number' => $reference ?? 'PAY-' . date('Ymd') . '-' . rand(1000, 9999),
                'notes' => $notes ?? 'Customer balance payment',
                'created_by' => $user?->id,
            ]);
        });
    }

    public function getCustomerLedger(Customer $customer, array $filters = []): LengthAwarePaginator
    {
        return CreditLedger::query()
            ->where('customer_id', $customer->id)
            ->with(['sale', 'creator'])
            ->latest('id')
            ->paginate($filters['per_page'] ?? 20);
    }
}
