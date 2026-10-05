<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_closings', function (Blueprint $table) {
            $table->id();
            $table->date('closing_date')->unique();
            $table->decimal('opening_cash', 12, 2)->default(0.00);
            $table->decimal('total_sales_amount', 12, 2)->default(0.00);
            $table->decimal('cash_sales_amount', 12, 2)->default(0.00);
            $table->decimal('credit_sales_amount', 12, 2)->default(0.00);
            $table->decimal('other_sales_amount', 12, 2)->default(0.00);
            $table->decimal('total_customer_payments', 12, 2)->default(0.00);
            $table->decimal('total_expenses', 12, 2)->default(0.00);
            $table->decimal('total_refunds', 12, 2)->default(0.00);
            $table->decimal('expected_cash', 12, 2)->default(0.00);
            $table->decimal('actual_cash', 12, 2)->default(0.00);
            $table->decimal('difference', 12, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_reopened')->default(false);
            $table->timestamp('closed_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_closings');
    }
};
