<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPriceHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'old_base_price',
        'new_base_price',
        'old_purchase_price',
        'new_purchase_price',
        'changed_by',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'old_base_price' => 'decimal:2',
            'new_base_price' => 'decimal:2',
            'old_purchase_price' => 'decimal:2',
            'new_purchase_price' => 'decimal:2',
            'changed_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
