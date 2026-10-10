<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DevDatabaseExplorerController extends Controller
{
    protected array $allowedTables = [
        'customers',
        'products',
        'sales',
        'sale_items',
        'sale_payments',
        'credit_ledgers',
        'inventory_movements',
    ];

    public function inspectTable(Request $request, string $table): JsonResponse
    {
        // Enforce developer / admin authorization
        if (config('app.env') === 'production') {
            return ApiResponse::error('Database explorer is disabled in production environment.', 403);
        }

        if (!in_array($table, $this->allowedTables, true)) {
            return ApiResponse::error("Unauthorized table inspection. Allowed tables: " . implode(', ', $this->allowedTables), 400);
        }

        $perPage = max(1, min(100, (int) ($request->per_page ?? 20)));
        $records = DB::table($table)->latest('id')->paginate($perPage);

        return ApiResponse::success([
            'table' => $table,
            'records' => $records,
            'allowed_tables' => $this->allowedTables,
        ], "Read-only inspection for table '{$table}'.");
    }
}
