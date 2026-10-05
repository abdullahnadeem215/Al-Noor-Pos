<?php

namespace App\Services;

use InvalidArgumentException;

class WeightCalculationService
{
    /**
     * Convert any weight input into internal Canonical Grams.
     * 1 kg = 1000g
     * 1 pao = 250g
     * 0.5 kg (half kg) = 500g
     */
    public function normalizeToGrams(string|int|float $value, string $unit = 'gram'): float
    {
        $val = (float) $value;
        if ($val <= 0) {
            throw new InvalidArgumentException("Weight value must be greater than zero.");
        }

        $normalizedUnit = strtolower(trim($unit));

        return match ($normalizedUnit) {
            'kg', 'kilogram', 'kilograms' => round($val * 1000.0, 3),
            'pao' => round($val * 250.0, 3),
            'half_kg', 'half kg', 'half-kg' => round($val * 500.0, 3),
            'gram', 'grams', 'g' => round($val, 3),
            default => throw new InvalidArgumentException("Unsupported weight unit [{$unit}]. Supported: kg, pao, half_kg, gram."),
        };
    }

    /**
     * Calculate price for a given weight in grams.
     * Price = (grams / 1000) * base_price_per_kg
     */
    public function calculatePriceByWeight(float $basePricePerKg, float $grams): float
    {
        if ($basePricePerKg < 0) {
            throw new InvalidArgumentException("Base price cannot be negative.");
        }
        if ($grams <= 0) {
            throw new InvalidArgumentException("Weight in grams must be greater than zero.");
        }

        $price = ($grams / 1000.0) * $basePricePerKg;

        return round($price, 2);
    }

    /**
     * Calculate weight in grams from a specified monetary amount.
     * Weight in grams = (amount / base_price_per_kg) * 1000
     */
    public function calculateWeightByAmount(float $basePricePerKg, float $amount): array
    {
        if ($basePricePerKg <= 0) {
            throw new InvalidArgumentException("Base price must be greater than zero for amount calculation.");
        }
        if ($amount <= 0) {
            throw new InvalidArgumentException("Amount must be greater than zero.");
        }

        $grams = ($amount / $basePricePerKg) * 1000.0;

        return [
            'weight_grams' => round($grams, 3),
            'display_grams' => round($grams, 2),
            'amount' => round($amount, 2),
            'base_price_per_kg' => round($basePricePerKg, 2),
        ];
    }

    /**
     * Calculate price for quantity-based selling mode.
     * Price = quantity * unit_price
     */
    public function calculateQuantityPrice(float $unitPrice, float $quantity): float
    {
        if ($unitPrice < 0) {
            throw new InvalidArgumentException("Unit price cannot be negative.");
        }
        if ($quantity <= 0) {
            throw new InvalidArgumentException("Quantity must be greater than zero.");
        }

        return round($quantity * $unitPrice, 2);
    }
}
