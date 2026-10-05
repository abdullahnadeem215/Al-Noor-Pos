<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\StoreProductRequest;
use App\Http\Requests\Api\V1\Product\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = $this->productService->searchProducts($request->all());

        return ApiResponse::success($products, 'Products retrieved successfully.');
    }

    public function search(Request $request): JsonResponse
    {
        $products = $this->productService->searchProducts($request->all());

        return ApiResponse::success($products, 'Product search results.');
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->createProduct(
            $request->validated(),
            $request->user()?->id
        );

        return ApiResponse::success($product->load('category'), 'Product created successfully.', 201);
    }

    public function show(Product $product): JsonResponse
    {
        return ApiResponse::success($product->load(['category', 'priceHistories']), 'Product details retrieved.');
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $updated = $this->productService->updateProduct(
            $product,
            $request->validated(),
            $request->user()?->id
        );

        return ApiResponse::success($updated->load('category'), 'Product updated successfully.');
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->productService->deleteProduct($product);

        return ApiResponse::success(null, 'Product deleted successfully.');
    }
}
