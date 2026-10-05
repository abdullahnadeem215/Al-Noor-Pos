<?php

namespace Tests\Feature;

use App\Enums\SellingMode;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiAuthAndValidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'role' => UserRole::OWNER,
            'status' => 'active',
        ]);

        $this->cashier = User::factory()->create([
            'role' => UserRole::CASHIER,
            'status' => 'active',
        ]);

        $this->category = Category::create([
            'name' => 'Daal',
            'status' => 'active',
        ]);
    }

    public function test_user_can_login_via_api_and_receive_sanctum_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $this->cashier->email,
            'password' => 'password', // Default factory password
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_cashier_can_calculate_and_create_sale(): void
    {
        $sugar = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Sugar',
            'sku' => 'SUGAR-TEST',
            'selling_mode' => SellingMode::WEIGHT,
            'base_price' => 180.00,
            'current_stock' => 50000.00,
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales/calculate', [
                'items' => [
                    [
                        'product_id' => $sugar->id,
                        'weight' => 1,
                        'weight_unit' => 'pao',
                    ]
                ]
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.subtotal', 45)
            ->assertJsonPath('data.items.0.weight_grams', 250);

        $finalizeResponse = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', [
                'items' => [
                    [
                        'product_id' => $sugar->id,
                        'weight' => 1,
                        'weight_unit' => 'pao',
                    ]
                ],
                'paid_amount' => 45.00,
            ]);

        $finalizeResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total', '45.00');

    }

    public function test_dashboard_api_returns_correct_kpi_summary(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson('/api/v1/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'today_sales',
                    'today_transactions',
                    'today_expenses',
                    'outstanding_credit',
                    'low_stock_products',
                    'top_selling_products',
                ]
            ]);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(401);
    }
}
