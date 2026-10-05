<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Return\StoreReturnRequest;
use App\Models\SalesReturn;
use App\Services\ReturnService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReturnController extends Controller
{
    public function __construct(
        protected ReturnService $returnService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = SalesReturn::query()->with(['sale', 'customer', 'creator']);

        if (!empty($request->return_number)) {
            $query->where('return_number', 'ILIKE', "%{$request->return_number}%");
        }

        $returns = $query->latest()->paginate($request->per_page ?? 20);

        return ApiResponse::success($returns, 'Returns list retrieved.');
    }

    public function store(StoreReturnRequest $request): JsonResponse
    {
        $salesReturn = $this->returnService->processReturn($request->validated(), $request->user());

        return ApiResponse::success($salesReturn, 'Return processed and inventory restored.', 201);
    }

    public function show(SalesReturn $return): JsonResponse
    {
        return ApiResponse::success($return->load(['items', 'sale', 'customer', 'creator']), 'Return transaction details.');
    }
}
