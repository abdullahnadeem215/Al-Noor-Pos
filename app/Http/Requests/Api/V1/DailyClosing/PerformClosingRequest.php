<?php

namespace App\Http\Requests\Api\V1\DailyClosing;

use Illuminate\Foundation\Http\FormRequest;

class PerformClosingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'closing_date' => ['nullable', 'date'],
            'opening_cash' => ['nullable', 'numeric', 'min:0'],
            'actual_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
