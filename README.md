# Al-Noor Mart POS & Inventory Management Backend (v1.0.0)

An API-First custom retail/business management backend for Al-Noor Mart (wholesale/retail shop in Pakistan). Built with Laravel 11, PHP 8.4, PostgreSQL 18, and Laravel Sanctum.

---

## Key Features

1. **API-First Architecture**: Completely independent from frontend UI. Consumable by any web, mobile (Flutter/React Native), or desktop POS app via versioned REST APIs (`/api/v1/*`).
2. **Dual Selling Modes**:
   - **Weight-Based Mode**: Sold by weight (grams, pao, half kg, kg) or monetary amount (e.g. "PKR 100 ki sugar"). Stock stored internally in canonical **Grams** (`DECIMAL(12,3)`).
   - **Quantity-Based Mode**: Sold by piece count (pieces, packs, boxes, bottles). Stock stored in units (`DECIMAL(12,2)`).
3. **Authoritative Calculation Engine**: Backend strictly enforces pricing, weight conversions, and stock availability.
4. **Historical Price Snapshot**: `sale_items` snapshot product names and base prices at the time of sale. Future price updates do not alter past invoices or return refunds.
5. **Transaction-Safe Inventory**: Every stock movement (purchase, sale, return, adjustment) generates an immutable record in `inventory_movements`. Uses database row locking (`lockForUpdate()`) to prevent race conditions.
6. **Customer Credit Ledger**: Customer debit/credit tracking, partial payments, outstanding balance tracking.
7. **Purchase & Supplier Module**: Stock replenishment, supplier balance management.
8. **Sales Returns**: Restores stock and calculates refunds based on snapshot prices.
9. **Expense Management**: Operational cost tracking by categories.
10. **Daily Closing**: Register balancing, expected cash calculation (`opening_cash + cash_sales + credit_payments - expenses - refunds`), actual cash difference recording.
11. **Reports & Dashboard API**: Daily sales, product sales, category sales, inventory valuation, expenses, credit balances, cashier performance, and dashboard metrics.
12. **Idempotency Protection**: `X-Idempotency-Key` header prevents duplicate billing.

---

## Tech Stack

- **Framework**: Laravel 11 (PHP 8.4+)
- **Database**: PostgreSQL 18.4 (`al_noor_grocery` & `al_noor_grocery_test`)
- **Authentication**: Laravel Sanctum Bearer Tokens
- **Testing**: PHPUnit (20/20 tests passing)

---

## System Setup

### 1. Requirements
Ensure PHP 8.3+, Composer 2.x, and PostgreSQL 15+ are installed.

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
php artisan key:generate
```

PostgreSQL Configuration in `.env`:
```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=al_noor_grocery
DB_USERNAME=postgres
DB_PASSWORD=
```

### 3. Run Migrations & Seeders
```bash
php artisan migrate:fresh --seed
```

### 4. Demo User Credentials
- **Owner**: `owner@alnoormart.com` / `password123`
- **Cashier**: `cashier@alnoormart.com` / `password123`

---

## Running Automated Tests

Run the complete test suite:
```bash
php vendor/bin/phpunit
```

---

## Documentation Index

- [ARCHITECTURE.md](ARCHITECTURE.md) – Technical Architecture & Module Structure
- [DATABASE.md](DATABASE.md) – PostgreSQL Schema & Precision Rules
- [ERD.md](ERD.md) – Entity Relationship Diagram
- [BUSINESS_RULES.md](BUSINESS_RULES.md) – Weight Formulas & Business Rules
- [API.md](API.md) – API Documentation & Endpoint Examples
- [DEPLOYMENT.md](DEPLOYMENT.md) – Production Deployment & Backup/Restore Guide
- [SECURITY.md](SECURITY.md) – Sanctum RBAC & Concurrency Security
- [TESTING.md](TESTING.md) – Automated Testing Guide & Scenarios
- [CHANGELOG.md](CHANGELOG.md) – Release Notes
