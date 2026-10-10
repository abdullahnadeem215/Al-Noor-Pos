<?php

namespace App\Models;

use App\Enums\SellingMode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'sku',
        'barcode',
        'description',
        'selling_mode',
        'stock_unit',
        'base_unit',
        'base_price',
        'purchase_price',
        'wholesale_price',
        'minimum_stock',
        'current_stock',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'selling_mode' => SellingMode::class,
            'base_price' => 'decimal:2',
            'purchase_price' => 'decimal:2',
            'wholesale_price' => 'decimal:2',
            'minimum_stock' => 'decimal:3',
            'current_stock' => 'decimal:3',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(ProductPriceHistory::class);
    }

    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function isWeightMode(): bool
    {
        return $this->selling_mode === SellingMode::WEIGHT;
    }

    public function isQuantityMode(): bool
    {
        return $this->selling_mode === SellingMode::QUANTITY;
    }
}
