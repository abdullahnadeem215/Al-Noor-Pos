<?php

namespace App\Http\Requests\Api\V1\Return;

use Illuminate\Foundation\Http\FormRequest;

class StoreReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sale_id' => ['required', 'exists:sales,id'],
            'refund_payment_method' => ['nullable', 'string', 'in:cash,credit_deduction,bank,online'],
            'reason' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'exists:sale_items,id'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0'],
            'items.*.weight_grams' => ['nullable', 'numeric', 'min:0'],
            'items.*.weight' => ['nullable', 'numeric', 'min:0'],
            'items.*.weight_unit' => ['nullable', 'string'],
        ];
    }
}
