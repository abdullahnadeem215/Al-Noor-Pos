<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyClosing extends Model
{
    use HasFactory;

    protected $fillable = [
        'closing_date',
        'opening_cash',
        'total_sales_amount',
        'cash_sales_amount',
        'credit_sales_amount',
        'other_sales_amount',
        'total_customer_payments',
        'total_expenses',
        'total_refunds',
        'expected_cash',
        'actual_cash',
        'difference',
        'notes',
        'closed_by',
        'is_reopened',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'closing_date' => 'date',
            'opening_cash' => 'decimal:2',
            'total_sales_amount' => 'decimal:2',
            'cash_sales_amount' => 'decimal:2',
            'credit_sales_amount' => 'decimal:2',
            'other_sales_amount' => 'decimal:2',
            'total_customer_payments' => 'decimal:2',
            'total_expenses' => 'decimal:2',
            'total_refunds' => 'decimal:2',
            'expected_cash' => 'decimal:2',
            'actual_cash' => 'decimal:2',
            'difference' => 'decimal:2',
            'is_reopened' => 'boolean',
            'closed_at' => 'datetime',
        ];
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
