# Al-Noor Mart POS - Automated Testing Guide

## 1. Overview
The test suite validates weight conversion formulas, amount-to-weight calculations, quantity pricing, stock deductions, historical price snapshots, credit ledgers, daily closings, and API authentication.

## 2. Running Automated Tests

To run the complete PHPUnit test suite:
```bash
php vendor/bin/phpunit
```

Or run via Laravel Artisan:
```bash
php artisan test
```

## 3. Test Suites & Critical Scenarios Covered

### Unit Tests (`tests/Unit/WeightCalculationTest.php`)
- `1kg` Sugar @ 180 = `PKR 180.00`
- `500g` Sugar @ 180 = `PKR 90.00`
- `250g` (1 pao) Sugar @ 180 = `PKR 45.00`
- `100g` Sugar @ 180 = `PKR 18.00`
- `PKR 100` Sugar @ 180/kg = `555.556g`
- `3` Toothpastes @ 180 = `PKR 540.00`

### Critical Business Scenarios (`tests/Feature/CriticalBusinessScenariosTest.php`)
1. **Scenario 1**: 1 pao Sugar -> 250g, PKR 45
2. **Scenario 2**: PKR 100 ki Sugar -> 555.556g, PKR 100
3. **Scenario 3**: 3 Toothpastes -> 3 x 180 = PKR 540
4. **Scenario 4**: Sugar stock 10kg minus 250g sale = 9.75kg remaining
5. **Scenario 5**: Toothpaste stock 10 pieces minus 3 sale = 7 pieces remaining
6. **Scenario 6**: Price change 180 -> 200/kg; historical invoice snapshot preserves 180/kg while new sale uses 200/kg.

### Stock & Inventory Safety (`tests/Feature/InventoryAndStockSafetyTest.php`)
- Purchase increases stock (+), sale decreases stock (-), return restores stock (+).
- Rejection of sales exceeding available stock when negative stock is disallowed.

### API & Authorization (`tests/Feature/ApiAuthAndValidationTest.php`)
- Sanctum bearer token login & profile.
- POS calculate and finalize sale endpoints.
- Dashboard API summary response.
- Unauthenticated route rejection (401).
