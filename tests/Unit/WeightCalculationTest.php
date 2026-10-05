<?php

namespace Tests\Unit;

use App\Services\WeightCalculationService;
use PHPUnit\Framework\TestCase;

class WeightCalculationTest extends TestCase
{
    protected WeightCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new WeightCalculationService();
    }

    public function test_1kg_sugar_at_180_equals_180_pkr(): void
    {
        $grams = $this->service->normalizeToGrams(1, 'kg');
        $price = $this->service->calculatePriceByWeight(180.00, $grams);

        $this->assertEquals(1000.0, $grams);
        $this->assertEquals(180.00, $price);
    }

    public function test_500g_sugar_at_180_equals_90_pkr(): void
    {
        $grams = $this->service->normalizeToGrams(500, 'gram');
        $price = $this->service->calculatePriceByWeight(180.00, $grams);

        $this->assertEquals(500.0, $grams);
        $this->assertEquals(90.00, $price);
    }

    public function test_1_pao_sugar_at_180_equals_45_pkr(): void
    {
        $grams = $this->service->normalizeToGrams(1, 'pao');
        $price = $this->service->calculatePriceByWeight(180.00, $grams);

        $this->assertEquals(250.0, $grams);
        $this->assertEquals(45.00, $price);
    }

    public function test_100g_sugar_at_180_equals_18_pkr(): void
    {
        $grams = $this->service->normalizeToGrams(100, 'gram');
        $price = $this->service->calculatePriceByWeight(180.00, $grams);

        $this->assertEquals(100.0, $grams);
        $this->assertEquals(18.00, $price);
    }

    public function test_100_pkr_sugar_at_180_per_kg_calculates_555_point_556_grams(): void
    {
        $result = $this->service->calculateWeightByAmount(180.00, 100.00);

        $this->assertEquals(555.556, $result['weight_grams']);
        $this->assertEquals(555.56, $result['display_grams']);
        $this->assertEquals(100.00, $result['amount']);
    }

    public function test_3_toothpaste_at_180_equals_540_pkr(): void
    {
        $price = $this->service->calculateQuantityPrice(180.00, 3);

        $this->assertEquals(540.00, $price);
    }
}
