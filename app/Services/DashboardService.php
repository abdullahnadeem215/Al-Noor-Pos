<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\SalesReturn;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getDashboardSummary(): array
    {
        $today = now()->toDateString();

        // Today's finalized sales query
        $todaySalesQuery = Sale::whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
        $grossTodaySales = round((float) ($todaySalesQuery->sum('total') ?? 0.0), 2);
        $todayBills = $todaySalesQuery->count();

        // Today's returns
        $todayReturns = round((float) (SalesReturn::whereDate('created_at', $today)->sum('total_refund_amount') ?? 0.0), 2);
        $netTodaySales = round(max(0, $grossTodaySales - $todayReturns), 2);

        // Average Bill Value
        $averageBillValue = $todayBills > 0 ? round($netTodaySales / $todayBills, 2) : 0.0;

        // Cash collected today from sale_payments
        $cashCollectedToday = round((float) (
            SalePayment::whereHas('sale', function ($q) use ($today) {
                $q->whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
            })->where('payment_method', 'cash')->sum('amount') ?? 0.0
        ), 2);

        // Credit (Udhaar) issued today
        $creditIssuedToday = round((float) (
            SalePayment::whereHas('sale', function ($q) use ($today) {
                $q->whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
            })->where('payment_method', 'credit')->sum('amount') ?? 0.0
        ), 2);

        // Online payments today
        $onlineCollectedToday = round((float) (
            SalePayment::whereHas('sale', function ($q) use ($today) {
                $q->whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
            })->where('payment_method', 'online')->sum('amount') ?? 0.0
        ), 2);

        // Expenses & Outstanding Credit
        $todayExpensesAmount = round((float) (Expense::whereDate('expense_date', $today)->sum('amount') ?? 0.0), 2);
        $outstandingCredit = round((float) (Customer::where('current_balance', '>', 0)->sum('current_balance') ?? 0.0), 2);

        // Low stock products query & count
        $lowStockQuery = Product::where('status', 'active')->whereRaw('current_stock <= minimum_stock');
        $lowStockCount = $lowStockQuery->count();
        $lowStockProducts = $lowStockQuery->take(10)->get([
            'id', 'name', 'sku', 'selling_mode', 'current_stock', 'minimum_stock', 'base_unit'
        ]);

        // Top selling products query from finalized sale_items
        $topSellingProducts = SaleItem::whereHas('sale', function ($q) use ($today) {
                $q->whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
            })
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select(
                'sale_items.product_id',
                'sale_items.product_name_snapshot as name',
                'products.sku',
                'products.selling_mode',
                'products.base_unit'
            )
            ->selectRaw('SUM(CASE WHEN sale_items.selling_mode = \'weight\' THEN sale_items.weight_grams / 1000 ELSE sale_items.quantity END) as quantity_sold')
            ->selectRaw('SUM(sale_items.total) as revenue')
            ->groupBy('sale_items.product_id', 'sale_items.product_name_snapshot', 'products.sku', 'products.selling_mode', 'products.base_unit')
            ->orderByDesc('revenue')
            ->take(5)
            ->get();

        return [
            'today_sales' => $netTodaySales,
            'today_bills' => $todayBills,
            'today_transactions' => $todayBills,
            'cash_today' => $cashCollectedToday,
            'credit_today' => $creditIssuedToday,
            'online_today' => $onlineCollectedToday,
            'returns_today' => $todayReturns,
            'average_bill_value' => $averageBillValue,
            'today_expenses' => $todayExpensesAmount,
            'outstanding_credit' => $outstandingCredit,
            'low_stock_count' => $lowStockCount,
            'low_stock_products' => $lowStockProducts,
            'top_selling_products' => $topSellingProducts,
            'sales_breakdown' => [
                'cash' => $cashCollectedToday,
                'credit' => $creditIssuedToday,
                'online' => $onlineCollectedToday,
                'returns' => $todayReturns,
                'net_sales' => $netTodaySales,
            ],
        ];
    }
}
