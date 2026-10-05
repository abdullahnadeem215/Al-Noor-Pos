<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\InventoryService;
use App\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService,
        protected InventoryService $inventoryService
    ) {}

    public function dailySales(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $report = $this->reportService->getDailySalesReport($startDate, $endDate);

        return ApiResponse::success($report, 'Daily sales report summary.');
    }

    public function productSales(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $report = $this->reportService->getProductSalesReport($startDate, $endDate);

        return ApiResponse::success($report, 'Product sales report.');
    }

    public function categorySales(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $report = $this->reportService->getCategorySalesReport($startDate, $endDate);

        return ApiResponse::success($report, 'Category sales report.');
    }

    public function inventory(): JsonResponse
    {
        $summary = $this->inventoryService->getStockSummary();

        return ApiResponse::success($summary, 'Inventory stock valuation report.');
    }

    public function expenses(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $report = $this->reportService->getExpenseReport($startDate, $endDate);

        return ApiResponse::success($report, 'Expenses breakdown report.');
    }

    public function customerCredit(): JsonResponse
    {
        $report = $this->reportService->getCustomerCreditReport();

        return ApiResponse::success($report, 'Customer credit balances report.');
    }

    public function cashiers(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $report = $this->reportService->getCashierReport($startDate, $endDate);

        return ApiResponse::success($report, 'Cashier performance report.');
    }
}
