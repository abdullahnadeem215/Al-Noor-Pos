<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return ApiResponse::success(Setting::all(), 'Application settings.');
    }

    public function update(Request $request): JsonResponse
    {
        $settings = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['present'],
            'settings.*.description' => ['nullable', 'string'],
        ]);

        foreach ($settings['settings'] as $item) {
            Setting::set($item['key'], $item['value'], $item['description'] ?? null);
        }

        return ApiResponse::success(Setting::all(), 'Settings updated successfully.');
    }
}
