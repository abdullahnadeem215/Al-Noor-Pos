<?php

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DailyClosingController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\PurchaseController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ReturnController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\SupplierController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes - Al-Noor Mart POS & Inventory Backend
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Authentication Routes
    Route::post('auth/login', [AuthController::class, 'login']);

    // Authenticated API Routes
    Route::middleware('auth:sanctum')->group(function () {

        // Auth management
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        // Categories API
        Route::apiResource('categories', CategoryController::class);

        // Products API
        Route::get('products/search', [ProductController::class, 'search']);
        Route::apiResource('products', ProductController::class);

        // Inventory Management
        Route::get('inventory/movements', [InventoryController::class, 'movements']);
        Route::get('inventory/low-stock', [InventoryController::class, 'lowStock']);
        Route::post('inventory/products/{product}/adjust', [InventoryController::class, 'adjust']);

        // Sales POS API
        Route::post('sales/calculate', [SaleController::class, 'calculate']);
        Route::post('sales', [SaleController::class, 'store']);
        Route::get('sales', [SaleController::class, 'index']);
        Route::get('sales/{sale}', [SaleController::class, 'show']);

        // Returns API
        Route::get('returns', [ReturnController::class, 'index']);
        Route::post('returns', [ReturnController::class, 'store']);
        Route::get('returns/{return}', [ReturnController::class, 'show']);

        // Purchases API
        Route::get('purchases', [PurchaseController::class, 'index']);
        Route::post('purchases', [PurchaseController::class, 'store']);
        Route::get('purchases/{purchase}', [PurchaseController::class, 'show']);

        // Customers & Credit Ledger API
        Route::post('customers/{customer}/payment', [CustomerController::class, 'recordPayment']);
        Route::get('customers/{customer}/ledger', [CustomerController::class, 'ledger']);
        Route::apiResource('customers', CustomerController::class);

        // Suppliers API
        Route::apiResource('suppliers', SupplierController::class);

        // Expenses API
        Route::get('expenses/categories', [ExpenseController::class, 'listCategories']);
        Route::post('expenses/categories', [ExpenseController::class, 'storeCategory']);
        Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store']);

        // Daily Closing API
        Route::get('daily-closing/preview', [DailyClosingController::class, 'preview']);
        Route::post('daily-closing/{dailyClosing}/reopen', [DailyClosingController::class, 'reopen']);
        Route::apiResource('daily-closing', DailyClosingController::class)->only(['index', 'store', 'show']);

        // Reports API
        Route::prefix('reports')->group(function () {
            Route::get('daily-sales', [ReportController::class, 'dailySales']);
            Route::get('product-sales', [ReportController::class, 'productSales']);
            Route::get('category-sales', [ReportController::class, 'categorySales']);
            Route::get('inventory', [ReportController::class, 'inventory']);
            Route::get('expenses', [ReportController::class, 'expenses']);
            Route::get('customer-credit', [ReportController::class, 'customerCredit']);
            Route::get('cashiers', [ReportController::class, 'cashiers']);
        });

        // Dashboard API
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Audit Logs API
        Route::get('audit-logs', [AuditLogController::class, 'index']);

        // Business Settings API
        Route::get('settings', [SettingController::class, 'index']);
        Route::put('settings', [SettingController::class, 'update']);

        // Dev Read-Only Database Explorer API
        Route::get('dev/db-explorer/{table}', [\App\Http\Controllers\Api\V1\DevDatabaseExplorerController::class, 'inspectTable']);
    });
});
