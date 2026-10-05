<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Expense\StoreExpenseCategoryRequest;
use App\Http\Requests\Api\V1\Expense\StoreExpenseRequest;
use App\Models\ExpenseCategory;
use App\Services\ExpenseService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(
        protected ExpenseService $expenseService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $expenses = $this->expenseService->listExpenses($request->all());

        return ApiResponse::success($expenses, 'Expenses list.');
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = $this->expenseService->createExpense($request->validated(), $request->user());

        return ApiResponse::success($expense->load('category'), 'Expense recorded.', 201);
    }

    public function listCategories(): JsonResponse
    {
        return ApiResponse::success(ExpenseCategory::withCount('expenses')->get(), 'Expense categories list.');
    }

    public function storeCategory(StoreExpenseCategoryRequest $request): JsonResponse
    {
        $category = $this->expenseService->createCategory($request->validated());

        return ApiResponse::success($category, 'Expense category created.', 201);
    }
}
