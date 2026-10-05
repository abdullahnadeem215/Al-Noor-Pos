<?php

namespace App\Models;

use App\Enums\SellingMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name_snapshot',
        'selling_mode',
        'unit_base_price_snapshot',
        'quantity',
        'weight_grams',
        'subtotal',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'selling_mode' => SellingMode::class,
            'unit_base_price_snapshot' => 'decimal:2',
            'quantity' => 'decimal:2',
            'weight_grams' => 'decimal:3',
            'subtotal' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
