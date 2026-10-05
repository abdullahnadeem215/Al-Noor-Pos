<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->string('product_name_snapshot');
            $table->string('selling_mode'); // weight, quantity
            $table->decimal('unit_base_price_snapshot', 12, 2); // price per kg or piece at time of sale
            $table->decimal('quantity', 12, 2)->nullable(); // null for weight
            $table->decimal('weight_grams', 12, 3)->nullable(); // null for quantity
            $table->decimal('subtotal', 12, 2);
            $table->decimal('total', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
