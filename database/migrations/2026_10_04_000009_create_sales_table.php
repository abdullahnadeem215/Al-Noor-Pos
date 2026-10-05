<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->string('idempotency_key')->nullable()->unique();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('total', 12, 2);
            $table->decimal('paid_amount', 12, 2);
            $table->decimal('due_amount', 12, 2)->default(0.00);
            $table->string('payment_status')->default('paid')->index(); // paid, partial, unpaid, credit
            $table->string('sale_status')->default('completed')->index(); // completed, returned, partial_return, cancelled
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
