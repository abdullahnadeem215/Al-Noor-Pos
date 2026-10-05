<?php

namespace App\Http\Middleware;

use App\Models\Sale;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');

        if ($key) {
            $existingSale = Sale::where('idempotency_key', $key)->first();
            if ($existingSale) {
                return ApiResponse::success(
                    $existingSale->load(['items', 'payments', 'customer', 'cashier']),
                    'Duplicate request ignored. Existing sale invoice retrieved.',
                    200
                );
            }
        }

        return $next($request);
    }
}
