<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Supplier\StoreSupplierRequest;
use App\Http\Requests\Api\V1\Supplier\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();

        if (!empty($request->search)) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'ILIKE', "%{$term}%")
                    ->orWhere('phone', 'ILIKE', "%{$term}%");
            });
        }

        $suppliers = $query->orderBy('name')->paginate($request->per_page ?? 20);

        return ApiResponse::success($suppliers, 'Suppliers list.');
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['opening_balance'] = $data['opening_balance'] ?? 0.00;
        $data['current_balance'] = $data['opening_balance'];

        $supplier = Supplier::create($data);

        return ApiResponse::success($supplier, 'Supplier created.', 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return ApiResponse::success($supplier->loadCount('purchases'), 'Supplier details.');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier->update($request->validated());

        return ApiResponse::success($supplier, 'Supplier updated.');
    }
}
