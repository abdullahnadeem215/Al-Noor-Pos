<?php

namespace App\Http\Requests\Api\V1\Sale;

use Illuminate\Foundation\Http\FormRequest;

class CalculateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.sale_mode' => ['nullable', 'string', 'in:weight,quantity,amount'],
            'items.*.weight_grams' => ['nullable', 'numeric', 'min:0'],
            'items.*.weight' => ['nullable', 'numeric', 'min:0'],
            'items.*.weight_unit' => ['nullable', 'string', 'in:gram,grams,g,kg,kilogram,pao,half_kg'],
            'items.*.amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
