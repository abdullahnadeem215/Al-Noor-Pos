<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'sku_snapshot')) {
                $table->string('sku_snapshot')->nullable()->after('product_name_snapshot');
            }
            if (!Schema::hasColumn('sale_items', 'unit_snapshot')) {
                $table->string('unit_snapshot')->nullable()->after('sku_snapshot');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (Schema::hasColumn('sale_items', 'unit_snapshot')) {
                $table->dropColumn('unit_snapshot');
            }
            if (Schema::hasColumn('sale_items', 'sku_snapshot')) {
                $table->dropColumn('sku_snapshot');
            }
        });
    }
};
