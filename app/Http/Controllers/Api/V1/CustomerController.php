<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Customer\RecordCreditPaymentRequest;
use App\Http\Requests\Api\V1\Customer\StoreCustomerRequest;
use App\Http\Requests\Api\V1\Customer\UpdateCustomerRequest;
use App\Models\Customer;
use App\Services\CreditLedgerService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected CreditLedgerService $creditLedgerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if (!empty($request->search)) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'ILIKE', "%{$term}%")
                    ->orWhere('phone', 'ILIKE', "%{$term}%");
            });
        }

        if ($request->boolean('has_balance')) {
            $query->where('current_balance', '>', 0);
        }

        $customers = $query->orderBy('name')->paginate($request->per_page ?? 20);

        return ApiResponse::success($customers, 'Customers list.');
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['opening_balance'] = $data['opening_balance'] ?? 0.00;
        $data['current_balance'] = $data['opening_balance'];

        $customer = Customer::create($data);

        return ApiResponse::success($customer, 'Customer created.', 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return ApiResponse::success($customer->loadCount('sales'), 'Customer details.');
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        return ApiResponse::success($customer, 'Customer updated.');
    }

    public function recordPayment(RecordCreditPaymentRequest $request, Customer $customer): JsonResponse
    {
        $ledger = $this->creditLedgerService->recordPayment(
            $customer,
            (float) $request->amount,
            $request->reference_number,
            $request->notes,
            $request->user()
        );

        return ApiResponse::success($ledger->load('customer'), 'Customer payment recorded successfully.');
    }

    public function ledger(Request $request, Customer $customer): JsonResponse
    {
        $ledger = $this->creditLedgerService->getCustomerLedger($customer, $request->all());

        return ApiResponse::success($ledger, 'Customer credit ledger history.');
    }
}
