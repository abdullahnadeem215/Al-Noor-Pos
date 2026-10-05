<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Category\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Category\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\CategoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        protected CategoryService $categoryService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = $this->categoryService->listCategories($request->all());

        return ApiResponse::success($categories, 'Categories retrieved successfully.');
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categoryService->createCategory(
            $request->validated(),
            $request->user()?->id
        );

        return ApiResponse::success($category, 'Category created successfully.', 201);
    }

    public function show(Category $category): JsonResponse
    {
        return ApiResponse::success($category->loadCount('products'), 'Category details retrieved.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $updatedCategory = $this->categoryService->updateCategory($category, $request->validated());

        return ApiResponse::success($updatedCategory, 'Category updated successfully.');
    }

    public function destroy(Category $category): JsonResponse
    {
        $this->categoryService->deleteCategory($category);

        return ApiResponse::success(null, 'Category deleted successfully.');
    }
}
