<?php

namespace App\Services;

use App\Enums\SellingMode;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\SalesReturn;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function getDailySalesReport(string $startDate, string $endDate): array
    {
        $sales = Sale::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->where('sale_status', '!=', 'cancelled')
            ->get();

        $totalSales = (float) $sales->sum('total');
        $invoiceCount = $sales->count();
        $creditSales = (float) $sales->sum('due_amount');
        $cashSales = (float) SalePayment::whereIn('sale_id', $sales->pluck('id'))
            ->where('payment_method', 'cash')
            ->sum('amount');

        $returns = (float) SalesReturn::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->sum('total_refund_amount');

        $netSales = round($totalSales - $returns, 2);

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_sales' => round($totalSales, 2),
            'invoice_count' => $invoiceCount,
            'cash_sales' => round($cashSales, 2),
            'credit_sales' => round($creditSales, 2),
            'returns' => round($returns, 2),
            'net_sales' => $netSales,
        ];
    }

    public function getProductSalesReport(string $startDate, string $endDate): Collection
    {
        return SaleItem::query()
            ->whereHas('sale', function ($q) use ($startDate, $endDate) {
                $q->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
                  ->where('sale_status', '!=', 'cancelled');
            })
            ->select('product_id', 'product_name_snapshot', 'selling_mode')
            ->selectRaw('SUM(quantity) as total_quantity_sold')
            ->selectRaw('SUM(weight_grams) as total_grams_sold')
            ->selectRaw('SUM(total) as total_revenue')
            ->groupBy('product_id', 'product_name_snapshot', 'selling_mode')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name_snapshot,
                    'selling_mode' => $item->selling_mode,
                    'quantity_sold' => $item->total_quantity_sold ? (float) $item->total_quantity_sold : null,
                    'weight_kg_sold' => $item->total_grams_sold ? round($item->total_grams_sold / 1000.0, 3) : null,
                    'weight_grams_sold' => $item->total_grams_sold ? (float) $item->total_grams_sold : null,
                    'total_revenue' => round((float) $item->total_revenue, 2),
                ];
            });
    }

    public function getCategorySalesReport(string $startDate, string $endDate): Collection
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween(DB::raw('DATE(sales.created_at)'), [$startDate, $endDate])
            ->where('sales.sale_status', '!=', 'cancelled')
            ->select('categories.id as category_id', 'categories.name as category_name')
            ->selectRaw('COUNT(DISTINCT sales.id) as total_transactions')
            ->selectRaw('SUM(sale_items.total) as total_sales')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_sales')
            ->get();
    }

    public function getExpenseReport(string $startDate, string $endDate): array
    {
        $expenses = Expense::with('category')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->get();

        $total = (float) $expenses->sum('amount');

        $byCategory = $expenses->groupBy('expense_category_id')->map(function ($group) {
            return [
                'category' => $group->first()->category?->name ?? 'Uncategorized',
                'total_amount' => round((float) $group->sum('amount'), 2),
            ];
        })->values();

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_expenses' => round($total, 2),
            'by_category' => $byCategory,
        ];
    }

    public function getCustomerCreditReport(): Collection
    {
        return Customer::where('current_balance', '>', 0)
            ->orderByDesc('current_balance')
            ->get(['id', 'name', 'phone', 'current_balance']);
    }

    public function getCashierReport(string $startDate, string $endDate): Collection
    {
        return User::whereIn('role', ['cashier', 'owner', 'manager'])
            ->get()
            ->map(function ($cashier) use ($startDate, $endDate) {
                $sales = Sale::where('cashier_id', $cashier->id)
                    ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
                    ->where('sale_status', '!=', 'cancelled')
                    ->get();

                return [
                    'cashier_id' => $cashier->id,
                    'cashier_name' => $cashier->name,
                    'transaction_count' => $sales->count(),
                    'total_sales' => round((float) $sales->sum('total'), 2),
                    'cash_collected' => round((float) $sales->sum('paid_amount'), 2),
                ];
            });
    }
}
