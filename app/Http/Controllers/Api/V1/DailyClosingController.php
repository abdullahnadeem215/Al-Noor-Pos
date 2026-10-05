<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\DailyClosing\PerformClosingRequest;
use App\Models\DailyClosing;
use App\Services\DailyClosingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailyClosingController extends Controller
{
    public function __construct(
        protected DailyClosingService $dailyClosingService
    ) {}

    public function preview(Request $request): JsonResponse
    {
        $preview = $this->dailyClosingService->previewClosing($request->date);

        return ApiResponse::success($preview, 'Daily closing calculations preview.');
    }

    public function store(PerformClosingRequest $request): JsonResponse
    {
        $closing = $this->dailyClosingService->performClosing($request->validated(), $request->user());

        return ApiResponse::success($closing, 'Daily closing completed successfully.', 201);
    }

    public function index(Request $request): JsonResponse
    {
        $closings = DailyClosing::with('closedBy')->latest('closing_date')->paginate($request->per_page ?? 20);

        return ApiResponse::success($closings, 'Daily closings history.');
    }

    public function show(DailyClosing $dailyClosing): JsonResponse
    {
        return ApiResponse::success($dailyClosing->load('closedBy'), 'Daily closing summary.');
    }

    public function reopen(DailyClosing $dailyClosing, Request $request): JsonResponse
    {
        $reopened = $this->dailyClosingService->reopenClosing($dailyClosing, $request->user());

        return ApiResponse::success($reopened, 'Daily closing reopened for adjustments.');
    }
}
