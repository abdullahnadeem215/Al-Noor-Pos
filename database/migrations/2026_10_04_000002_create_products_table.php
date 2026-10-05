<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('name')->index();
            $table->string('sku')->unique();
            $table->string('barcode')->nullable()->index();
            $table->text('description')->nullable();
            $table->string('selling_mode')->index(); // weight, quantity
            $table->string('stock_unit')->default('gram'); // gram for weight, piece/box for quantity
            $table->string('base_unit')->default('kg'); // kg for weight, piece for quantity
            $table->decimal('base_price', 12, 2); // price per kg or price per piece
            $table->decimal('purchase_price', 12, 2)->default(0.00);
            $table->decimal('minimum_stock', 12, 3)->default(0.000);
            $table->decimal('current_stock', 12, 3)->default(0.000); // grams for weight, count for quantity
            $table->string('status')->default('active')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
