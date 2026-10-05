# Implementation Plan - Al-Noor Mart POS & Inventory Backend

Build a production-ready, API-first Laravel 11 + PostgreSQL 18 backend for Al-Noor Mart (wholesale/retail shop in Pakistan). Supports dual selling modes (weight-based in grams/pao and quantity-based in pieces/boxes), transaction-safe inventory movements, customer credit ledgers, daily closing, sales returns, reports, dashboard APIs, and full automated test suite.

## User Review Required

- Database Engine: PostgreSQL 18 running on `127.0.0.1:5433` (Databases: `al_noor_grocery` and `al_noor_grocery_test`).
- Authentication: Laravel Sanctum bearer tokens.
- Default Currency & Timezone: `PKR` and `Asia/Karachi`.
- FBR/PRAL Compliance: Explicitly excluded as per prompt instructions.

## Open Questions

None. All domain requirements, calculations (pao, kg, grams, amount-to-weight), authorization, and endpoint behaviors are fully specified.

## Proposed Changes

### Phase 1: Project Initialization & Configuration
- Initialize Laravel 11 project in `d:\Al-Noor Grocery`.
- Configure `.env` and `.env.example` with PostgreSQL credentials (`127.0.0.1:5433`, DB `al_noor_grocery`).
- Install Laravel Sanctum for API token authentication.

### Phase 2: Core Data Architecture & Migrations
Create database migrations in `database/migrations/`:
- `users`: roles (`owner`, `cashier`, `manager`, `inventory`, `accountant`).
- `categories`: dynamic product categories.
- `products`: dual mode selling (`weight` / `quantity`), base price per kg/piece, current stock in grams or pieces.
- `product_price_histories`: track base and purchase price updates.
- `customers` & `credit_ledgers`: tracking debit/credit balances.
- `suppliers`: supplier profiles and balance.
- `purchases` & `purchase_items`: stock replenishment.
- `sales`, `sale_items`, `sale_payments`: sales transactions with price snapshot support.
- `sales_returns` & `sales_return_items`: item/weight returns.
- `inventory_movements`: immutable audit log of stock deltas.
- `expense_categories` & `expenses`: operational cost tracking.
- `daily_closings`: end-of-day register balancing.
- `audit_logs`: security and operational activity log.
- `settings`: key-value business configuration.

### Phase 3: Domain Models & Enums
Create Eloquent models and PHP 8 Enums:
- `SellingMode` (`weight`, `quantity`)
- `UserRole` (`owner`, `cashier`, `manager`, `inventory`, `accountant`)
- `PaymentMethod` (`cash`, `bank`, `card`, `online`, `credit`)
- `MovementType` (`opening_stock`, `purchase`, `sale`, `sale_return`, `purchase_return`, `adjustment`)
- Establish Eloquent relationships, cast attributes, and set up soft deletes.

### Phase 4: Business Logic Services
Build authoritative service layer in `app/Services/`:
- `WeightCalculationService`:
  - `calculateByWeight(basePricePerKg, grams)` -> total price
  - `calculateByAmount(basePricePerKg, amount)` -> weight in grams
  - `normalizeToGrams(unit, value)` -> grams (pao=250g, kg=1000g, half_kg=500g)
- `ProductService` & `CategoryService`: CRUD, SKU generation, soft deletes.
- `SaleService`:
  - `calculateCart(items)`: non-persisted quotation for POS UI.
  - `finalizeSale(data, user)`: DB transaction with `lockForUpdate()`, snapshot prices, update stock, log movement, handle credit ledger.
- `InventoryService`: handles stock updates and movement logs.
- `PurchaseService`: purchase entry and inventory addition.
- `ReturnService`: process returns and calculate refunds based on item price snapshots.
- `CreditLedgerService`: customer balance management.
- `ExpenseService` & `DailyClosingService`: end-of-day accounting.
- `ReportService` & `DashboardService`: sales metrics and low stock alerts.

### Phase 5: Form Requests & API Resources
- Form requests for strict validation (preventing weight sales on quantity products and vice versa, non-negative amounts, etc.).
- API resources for standard JSON output format (`success`, `message`, `data`, `errors`).

### Phase 6: Controllers & Routes
Register API endpoints under `/api/v1/*` in `routes/api.php`:
- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `/api/v1/categories` (CRUD)
- `/api/v1/products` & `/api/v1/products/search` (CRUD + Search)
- `POST /api/v1/sales/calculate` (POS non-persisted preview)
- `POST /api/v1/sales` (Finalize sale)
- `GET /api/v1/sales`, `GET /api/v1/sales/{id}`
- `/api/v1/returns`
- `/api/v1/purchases`
- `/api/v1/customers` & `/api/v1/customers/{id}/ledger`
- `/api/v1/suppliers`
- `/api/v1/expenses` & `/api/v1/expense-categories`
- `/api/v1/daily-closing` (Summary preview & final closing)
- `/api/v1/reports/*` (Daily, Product, Category, Inventory, Expenses, Credit, Cashier)
- `GET /api/v1/dashboard`
- `GET /api/v1/audit-logs`
- `/api/v1/settings`

### Phase 7: Authorization Policies & Middleware
- Define Laravel Policies for endpoints (Cashier vs Owner permissions).
- Implement Idempotency Middleware for `POST /api/v1/sales`.

### Phase 8: Seeders & Sample Data
- `DatabaseSeeder`, `UserSeeder`, `CategorySeeder`, `ProductSeeder`, `SettingSeeder`.
- Demo business: "Al-Noor Mart".
- Weight products: Sugar (PKR 180/kg), Rice (PKR 320/kg), Masoor Daal (PKR 280/kg).
- Quantity products: Toothpaste (PKR 180/piece), Lux Soap (PKR 120/piece).
- Demo credentials: Owner (`owner@alnoormart.com` / `password123`) & Cashier (`cashier@alnoormart.com` / `password123`).

## Verification Plan

### Automated Tests (PHPUnit / Pest)
Execute test suite via `php vendor/bin/phpunit`:
1. **Weight & Quantity Calculations**:
   - 1kg Sugar @ 180 = PKR 180
   - 500g Sugar @ 180 = PKR 90
   - 250g (1 pao) Sugar @ 180 = PKR 45
   - 100g Sugar @ 180 = PKR 18
   - PKR 100 Sugar @ 180/kg = 555.556g
   - 3 Toothpaste @ 180 = PKR 540
2. **Critical Business Scenarios 1-6**:
   - Scenario 1: 1 pao Sugar -> 250g, PKR 45
   - Scenario 2: PKR 100 Sugar -> 555.556g, PKR 100
   - Scenario 3: 3 Toothpaste -> 3 * 180 = PKR 540
   - Scenario 4: Stock deduction check (10kg -> buy 250g -> remaining 9.75kg)
   - Scenario 5: Quantity stock deduction check (10 pieces -> buy 3 -> remaining 7)
   - Scenario 6: Price snapshot check (Price changes 180 -> 200; old invoice remains 180, new sale uses 200).
3. **Inventory & Movement Safety**:
   - Purchase increases stock, sale decreases stock, return increases stock.
   - DB transaction rollback on failure.
4. **Validation & Authorization**:
   - Invalid mode sales rejected (HTTP 422).
   - Cashier blocked from owner operations (HTTP 403).

### Manual Verification
- Test all API endpoints via HTTP requests to `http://127.0.0.1:8000/api/v1/*`.
