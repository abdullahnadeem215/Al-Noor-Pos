# Changelog

All notable changes to the Al-Noor Mart POS & Inventory Backend will be documented in this file.

## [1.0.0] - 2026-10-04

### Added
- **API-First Clean Monolith**: Complete Laravel 11 + PostgreSQL 18 API backend.
- **Dual Selling Modes**:
  - Weight-based mode (grams, pao, half kg, kg, amount-based weight calculation).
  - Quantity-based mode (pieces, packs, boxes, bottles).
- **Weight Engine (`WeightCalculationService`)**: Canonical weight unit normalization in grams, amount-to-weight calculation (`amount / base_price_per_kg * 1000`).
- **Inventory System (`InventoryService`)**: Transaction-based inventory movements, low stock alerts, stock valuation, pessimistic row locking (`lockForUpdate()`).
- **Sales POS Engine (`SaleService`)**: POS cart preview endpoint (`POST /api/v1/sales/calculate`), atomic sale finalization (`POST /api/v1/sales`), price snapshots on `sale_items`.
- **Idempotency Protection (`IdempotencyMiddleware`)**: Duplicate billing prevention via `X-Idempotency-Key`.
- **Customer Credit Ledger (`CreditLedgerService`)**: Debit/credit customer accounts, partial payments, credit ledger history.
- **Purchase Management (`PurchaseService`)**: Stock replenishment, supplier balance tracking.
- **Sales Returns (`ReturnService`)**: Restores stock, calculates refunds based on historical price snapshots.
- **Expenses Module (`ExpenseService`)**: Category-wise expense tracking.
- **Daily Closing (`DailyClosingService`)**: End-of-day register summary, expected cash, actual cash difference, reopen protection.
- **Reports & Dashboard API (`ReportService`, `DashboardService`)**: Daily sales, product sales, category sales, inventory valuation, customer credit, cashier report, dashboard metrics.
- **Security & RBAC**: Laravel Sanctum authentication, role-based policies (`owner`, `cashier`).
- **Automated Test Suite**: 20/20 passing tests covering all 6 critical business scenarios and weight calculations.
