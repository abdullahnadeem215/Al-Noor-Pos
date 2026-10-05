<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class ExpenseService
{
    public function listExpenses(array $filters = []): LengthAwarePaginator
    {
        $query = Expense::query()->with(['category', 'creator']);

        if (!empty($filters['category_id'])) {
            $query->where('expense_category_id', $filters['category_id']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('expense_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('expense_date', '<=', $filters['end_date']);
        }

        return $query->latest('expense_date')->paginate($filters['per_page'] ?? 20);
    }

    public function createExpense(array $data, ?User $user = null): Expense
    {
        $data['created_by'] = $user?->id;
        $data['expense_date'] = $data['expense_date'] ?? now()->toDateString();
        $data['amount'] = round((float) $data['amount'], 2);

        return Expense::create($data);
    }

    public function createCategory(array $data): ExpenseCategory
    {
        return ExpenseCategory::create($data);
    }
}
