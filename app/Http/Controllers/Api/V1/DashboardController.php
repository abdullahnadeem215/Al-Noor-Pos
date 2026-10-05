<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(): JsonResponse
    {
        $summary = $this->dashboardService->getDashboardSummary();

        return ApiResponse::success($summary, 'Dashboard KPI metrics.');
    }
}
