<?php

namespace App\Http\Requests\Api\V1\Expense;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string'],
            'payment_method' => ['nullable', 'string', 'in:cash,bank,card,online'],
            'expense_date' => ['nullable', 'date'],
        ];
    }
}
