# Jexron Khata - Existing Database Map & Schema Blueprint

## 1. Existing PostgreSQL Database Schema

### Table: `users`
- `id`: bigint (PK)
- `name`: string
- `email`: string (unique)
- `password`: string
- `role`: string (`admin`, `cashier`, etc.)
- `status`: string (`active`, `inactive`)
- `timestamps`, `softDeletes`

### Table: `categories`
- `id`: bigint (PK)
- `name`: string
- `slug`: string
- `description`: text (nullable)
- `status`: string
- `timestamps`

### Table: `products`
- `id`: bigint (PK)
- `category_id`: foreignKey (`categories.id`)
- `name`: string
- `sku`: string (unique)
- `barcode`: string (nullable)
- `description`: text (nullable)
- `selling_mode`: string (`weight`, `quantity`)
- `stock_unit`: string (`gram`, `piece`)
- `base_unit`: string (`kg`, `piece`)
- `base_price`: decimal(12, 2) *(Default Selling Price)*
- `purchase_price`: decimal(12, 2)
- `wholesale_price`: decimal(12, 2) *(NEW COLUMN to be added)*
- `minimum_stock`: decimal(12, 3)
- `current_stock`: decimal(12, 3)
- `status`: string (`active`, `inactive`)
- `created_by`: foreignKey (`users.id`)
- `timestamps`, `softDeletes`

### Table: `customers`
- `id`: bigint (PK)
- `name`: string
- `phone`: string (nullable)
- `address`: text (nullable)
- `opening_balance`: decimal(12, 2)
- `current_balance`: decimal(12, 2) *(Positive means customer owes money)*
- `status`: string
- `timestamps`, `softDeletes`

### Table: `sales` (Invoices)
- `id`: bigint (PK)
- `invoice_number`: string (unique) *(e.g. KH-20261007-0001)*
- `idempotency_key`: string (nullable, unique)
- `customer_id`: foreignKey (`customers.id`)
- `subtotal`: decimal(12, 2)
- `total`: decimal(12, 2)
- `paid_amount`: decimal(12, 2)
- `due_amount`: decimal(12, 2)
- `payment_status`: string (`paid`, `partial`, `unpaid`, `credit`)
- `sale_status`: string (`completed`, `returned`, `cancelled`)
- `cashier_id`: foreignKey (`users.id`)
- `notes`: text (nullable)
- `timestamps`

### Table: `sale_items` (Invoice Items)
- `id`: bigint (PK)
- `sale_id`: foreignKey (`sales.id`)
- `product_id`: foreignKey (`products.id`)
- `product_name_snapshot`: string
- `sku_snapshot`: string *(NEW COLUMN to be added)*
- `unit_snapshot`: string *(NEW COLUMN to be added)*
- `selling_mode`: string
- `unit_base_price_snapshot`: decimal(12, 2) *(Charged unit price saved permanently)*
- `quantity`: decimal(12, 2)
- `weight_grams`: decimal(12, 3)
- `subtotal`: decimal(12, 2)
- `total`: decimal(12, 2)
- `timestamps`

### Table: `sale_payments` (Payment Records)
- `id`: bigint (PK)
- `sale_id`: foreignKey (`sales.id`, nullable for standalone customer payments)
- `payment_method`: string (`cash`, `bank`, `card`, `online`, `credit`)
- `amount`: decimal(12, 2)
- `reference_number`: string (nullable)
- `received_by`: foreignKey (`users.id`)
- `timestamps`

### Table: `credit_ledgers` (Customer Ledger Transactions)
- `id`: bigint (PK)
- `customer_id`: foreignKey (`customers.id`)
- `sale_id`: foreignKey (`sales.id`, nullable)
- `transaction_type`: string (`debit`, `credit`, `opening_balance`, `adjustment`)
- `amount`: decimal(12, 2)
- `balance_after`: decimal(12, 2)
- `reference_number`: string (nullable) *(e.g. KH-20261007-0001 or PAY-20261009-0001)*
- `notes`: text (nullable)
- `created_by`: foreignKey (`users.id`)
- `timestamps`

### Table: `inventory_movements` (Stock Movement Audit)
- `id`: bigint (PK)
- `product_id`: foreignKey (`products.id`)
- `movement_type`: string (`sale`, `purchase`, `adjustment`, `opening_stock`, etc.)
- `quantity_or_grams`: decimal(12, 3) *(Negative for deduction, positive for addition)*
- `stock_before`: decimal(12, 3)
- `stock_after`: decimal(12, 3)
- `reference_type`: string (nullable)
- `reference_id`: bigint (nullable)
- `user_id`: foreignKey (`users.id`)
- `notes`: text (nullable)
- `created_at`: timestamp

---

## 2. Logical Entity Relationship Diagram (ERD)

```
CUSTOMER (id, name, phone, current_balance)
   │
   ├───> INVOICE / SALE (id, invoice_number, total, due_amount)
   │        │
   │        ├───> INVOICE ITEMS / SALE_ITEMS (id, product_name_snapshot, unit_base_price_snapshot, total)
   │        │        │
   │        │        └───> PRODUCT (id, name, sku, purchase_price, wholesale_price, base_price, current_stock)
   │        │
   │        └───> STOCK MOVEMENT (id, movement_type='sale', quantity_or_grams)
   │
   ├───> CREDIT LEDGER (id, transaction_type=['debit','credit'], amount, balance_after, reference_number)
   │
   └───> SALE PAYMENT (id, amount, reference_number='PAY-YYYYMMDD-XXXX')
```

---

## 3. Database Migration Requirements Plan

To support all requirements cleanly while avoiding breaking existing schema:

1. **Migration 1**: Add `wholesale_price` to `products` table (nullable or default 0.00).
2. **Migration 2**: Add `sku_snapshot` and `unit_snapshot` to `sale_items` table (nullable).
3. **Migration 3**: Ensure `sale_id` in `credit_ledgers` and `sale_payments` handles standalone payment references cleanly.
