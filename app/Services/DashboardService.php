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

        // Today's Credit Sales (due_amount from sales created today)
        $todayCreditSales = round((float) (
            Sale::whereDate('created_at', $today)
                ->where('sale_status', '!=', 'cancelled')
                ->sum('due_amount') ?? 0.0
        ), 2);

        // Payments Received Today (from credit_ledgers transaction_type=credit today OR sale_payments)
        $paymentsReceivedToday = round((float) (
            \App\Models\CreditLedger::where('transaction_type', \App\Enums\LedgerType::CREDIT)
                ->whereDate('created_at', $today)
                ->sum('amount') ?? 0.0
        ), 2);

        // Total Outstanding Khaata (sum of positive customer current_balances)
        $totalOutstandingKhaata = round((float) (Customer::where('current_balance', '>', 0)->sum('current_balance') ?? 0.0), 2);

        // Total Active Customers
        $totalCustomers = Customer::where('status', 'active')->count();

        // Total Active Products
        $totalProducts = Product::where('status', 'active')->count();

        // Today's total sales
        $todaySalesQuery = Sale::whereDate('created_at', $today)->where('sale_status', '!=', 'cancelled');
        $grossTodaySales = round((float) ($todaySalesQuery->sum('total') ?? 0.0), 2);

        // Recent Khaata Transactions
        $recentTransactions = Sale::with(['customer', 'cashier'])
            ->latest('id')
            ->take(10)
            ->get();

        // Recent Payments
        $recentPayments = \App\Models\CreditLedger::where('transaction_type', \App\Enums\LedgerType::CREDIT)
            ->with(['customer', 'creator'])
            ->latest('id')
            ->take(10)
            ->get();

        return [
            'today_credit_sales' => $todayCreditSales,
            'payments_received_today' => $paymentsReceivedToday,
            'total_outstanding_khaata' => $totalOutstandingKhaata,
            'total_customers' => $totalCustomers,
            'total_products' => $totalProducts,
            'today_sales' => $grossTodaySales,
            'recent_transactions' => $recentTransactions,
            'recent_payments' => $recentPayments,
            'outstanding_credit' => $totalOutstandingKhaata,
        ];
    }
}
