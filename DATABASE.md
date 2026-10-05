# Al-Noor Mart - Database Architecture & Indexing Document

## 1. Engine & Configuration
- **Database Server**: PostgreSQL 18.4
- **Connection Port**: `5433` (Local environment default)
- **Primary Database**: `al_noor_grocery`
- **Testing Database**: `al_noor_grocery_test`
- **Collation / Encoding**: `UTF8` / `English_United States.1252`

## 2. Precision & Data Types Rules
- **Currency & Amounts**: `DECIMAL(12,2)` (e.g. `999,999,999.99`) for all subtotal, tax, discount, total, paid, due, balance, prices, and expense records. Binary float is disallowed.
- **Weights**: `DECIMAL(12,3)` (in grams, e.g., `555.556g`).
- **Quantities**: `DECIMAL(12,2)` (for unit counts and pieces).
- **Timestamps**: PostgreSQL `TIMESTAMPTZ` via Laravel `timestamps()`.

## 3. High-Performance Indexing Map
1. `products`:
   - `category_id` (foreign key index)
   - `sku` (UNIQUE index)
   - `barcode` (B-Tree index, nullable)
   - `name` (B-Tree index for quick POS lookup)
   - `selling_mode` (indexed)
2. `sales`:
   - `invoice_number` (UNIQUE index)
   - `idempotency_key` (UNIQUE index, nullable)
   - `cashier_id` (foreign key index)
   - `customer_id` (foreign key index)
   - `created_at` (B-Tree index for daily closing & reports)
3. `sale_items`:
   - `sale_id` (foreign key index)
   - `product_id` (foreign key index)
4. `inventory_movements`:
   - `product_id` (foreign key index)
   - `movement_type` (indexed)
   - `created_at` (indexed)
5. `customers`:
   - `phone` (B-Tree index)
   - `name` (indexed)
6. `credit_ledgers`:
   - `customer_id` (foreign key index)
   - `sale_id` (foreign key index)
   - `created_at` (indexed)
7. `daily_closings`:
   - `closing_date` (UNIQUE index)

## 4. Soft Delete Strategy
Soft deletes (`deleted_at`) are enabled on:
- `products`
- `categories`
- `customers`
- `suppliers`
- `users`

This guarantees that deleting a master entity never breaks historical sale invoices, purchase receipts, or credit ledgers.

## 5. Transaction Safety & Lock Protocol
For stock updates and sale finalizations:
```sql
BEGIN TRANSACTION;
SELECT * FROM products WHERE id IN (...) FOR UPDATE;
-- Validate current_stock >= requested_amount
-- Insert sale, sale_items, sale_payments, inventory_movements
-- Update current_stock
COMMIT;
```
