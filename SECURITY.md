# Al-Noor Mart POS - Security & Authorization Architecture

## 1. Authentication Strategy
- **Laravel Sanctum**: API requests are authenticated via bearer tokens issued upon login (`POST /api/v1/auth/login`).
- Passwords are encrypted using bcrypt hashing (`BCRYPT_ROUNDS=12`).

## 2. Role-Based Access Control (RBAC)
- **Roles**:
  - `owner`: Full privileges across all modules, settings, reports, daily re-openings, products, and categories.
  - `cashier`: Permitted to calculate cart, finalize sales, search products, list categories, process returns, and view shift daily closing.
  - `manager`, `inventory`, `accountant`: Configurable roles for future expansions.

## 3. Financial & Transaction Security
- **Backend Pricing Enforcement**: Price calculations, weight conversions, subtotal math, and stock deductions are strictly computed on the backend. Frontend calculated figures are never trusted.
- **Pessimistic Locking**: Product stock updates use database row locks (`lockForUpdate()`) inside PostgreSQL `BEGIN ... COMMIT` blocks to prevent race conditions during concurrent POS checkouts.
- **Snapshot Integrity**: Every sale item locks in `unit_base_price_snapshot` and `product_name_snapshot`. Price changes do not alter past invoices or return refunds.
- **Idempotency Protection**: `IdempotencyMiddleware` guards POST `/api/v1/sales` to prevent duplicate billing during network retries.

## 4. Input & SQL Injection Security
- Eloquent ORM parameterized queries prevent SQL injection.
- Form Requests sanitize all inputs and enforce strict validation rules.
- Production errors hide sensitive stack traces (`APP_DEBUG=false`).
