<?php

namespace App\Models;

use App\Enums\SellingMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id',
        'product_id',
        'product_name_snapshot',
        'selling_mode',
        'quantity',
        'weight_grams',
        'unit_purchase_price',
        'total_price',
    ];

    protected function casts(): array
    {
        return [
            'selling_mode' => SellingMode::class,
            'quantity' => 'decimal:2',
            'weight_grams' => 'decimal:3',
            'unit_purchase_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
