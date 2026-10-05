<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getDashboardSummary(): array
    {
        $today = now()->toDateString();

        $todaySalesQuery = Sale::whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
        $todaySalesAmount = round((float) ($todaySalesQuery->sum('total') ?? 0.0), 2);
        $todayTransactionCount = $todaySalesQuery->count();

        $todayExpensesAmount = round((float) (Expense::whereDate('expense_date', $today)->sum('amount') ?? 0.0), 2);
        $outstandingCredit = round((float) (Customer::where('current_balance', '>', 0)->sum('current_balance') ?? 0.0), 2);

        $lowStockProducts = Product::where('status', 'active')
            ->whereRaw('current_stock <= minimum_stock')
            ->take(10)
            ->get(['id', 'name', 'selling_mode', 'current_stock', 'minimum_stock', 'base_unit']);

        $topSellingProducts = SaleItem::whereHas('sale', function ($q) use ($today) {
                $q->whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
            })
            ->select('product_id', 'product_name_snapshot')
            ->selectRaw('SUM(total) as total_revenue')
            ->groupBy('product_id', 'product_name_snapshot')
            ->orderByDesc('total_revenue')
            ->take(5)
            ->get();

        return [
            'today_sales' => $todaySalesAmount,
            'today_transactions' => $todayTransactionCount,
            'today_expenses' => $todayExpensesAmount,
            'outstanding_credit' => $outstandingCredit,
            'low_stock_products' => $lowStockProducts,
            'top_selling_products' => $topSellingProducts,
        ];
    }
}
