# Jexron Khata - Current System Audit

## 1. System Overview & Architecture

The application is built on a **Laravel 11/12 (PHP 8.4)** backend API paired with a **Next.js (React 18 / Tailwind CSS / TypeScript / Radix UI)** frontend.
- **Backend API Base**: `http://localhost:8000/api/v1`
- **Database**: PostgreSQL (with migration support for SQLite / MySQL)
- **Authentication**: Laravel Sanctum bearer token authentication
- **Architecture Pattern**: Controller -> Service -> Model pattern with DB Transactions

---

## 2. Feature Classification Table

| Feature / Module | Existing Implementation File(s) | Classification | Action Plan |
|---|---|---|---|
| **Authentication** | `AuthController.php`, `User.php`, `auth-context.tsx` | **KEEP & REUSE** | Maintain Sanctum token auth, cashier/admin session context. |
| **Users & Roles** | `User.php`, `0001_01_01_000000_create_users_table.php` | **KEEP & REUSE** | Reuse existing user structure and authorization scopes. |
| **Product System** | `Product.php`, `ProductController.php`, `ProductService.php`, `products/page.tsx` | **MODIFY & REUSE** | Add `wholesale_price` column, add SKU & unit snapshots support, clear price display (Purchase, Wholesale, Selling). |
| **Customer Management** | `Customer.php`, `CustomerController.php`, `customers/page.tsx` | **KEEP & REUSE** | Keep existing customer entity, balance tracking, search capabilities. |
| **Khaata Invoices** | `Sale.php`, `SaleItem.php`, `SaleService.php`, `pos/page.tsx` | **MODIFY & REUSE** | Refactor POS invoice generator into Khaata Invoice engine. Enforce `KH-YYYYMMDD-0001` format, product master selection, price snapshot immutability. |
| **Invoice Items** | `SaleItem.php`, `2026_10_04_000010_create_sale_items_table.php` | **MODIFY & REUSE** | Add `sku_snapshot` and `unit_snapshot` fields to ensure historical immutability. |
| **Payments System** | `SalePayment.php`, `CreditLedgerService.php` | **MODIFY & REUSE** | Format payment receipts as `PAY-YYYYMMDD-0001`, ensure permanent retrievability without duplication. |
| **Customer Ledger** | `CreditLedger.php`, `CreditLedgerService.php` | **MODIFY & REUSE** | Add date range filtering (Today, Yesterday, This Week, This Month, Custom), add action buttons for View, Download, Print. |
| **Inventory Foundation** | `InventoryMovement.php`, `InventoryService.php` | **REUSE & KEEP** | Deduct stock ONLY on invoice finalization in atomic DB transaction. Drafts/Views/Downloads/Prints trigger ZERO stock movements. |
| **Dashboard** | `DashboardController.php`, `DashboardService.php`, `dashboard/page.tsx` | **MODIFY** | Focus metrics on Today's Credit Sales, Payments Received Today, Total Outstanding Khaata, Total Customers, Total Products, and quick actions. |
| **PDF & Printing System** | `receipt-modal.tsx`, web view helpers | **NEW / EXPAND** | Provide dedicated PDF export & printable views for Invoices, Payment Receipts, Customer Statements, and Product Price Lists. |
| **Dev Database Explorer** | None | **NEW** | Developer-only read-only explorer for inspecting PostgreSQL database tables directly in app. |
| **Complex POS Features** | FBR, PRAL, Tax, Loyalty, Online Orders, Subscriptions | **DISABLE** | Omit irrelevant POS complexity to keep application lean and focused on Khaata. |

---

## 3. High-Level Reuse & Modification Summary

1. **Authentication & Authorization**: Retained intact (`Sanctum`).
2. **Database Integrity**: All existing tables retained. Added non-destructive columns (`wholesale_price`, `sku_snapshot`, `unit_snapshot`).
3. **Immutability Assurance**: Finalized invoices and payment receipts will be saved permanently once created. Viewing, downloading, or printing never mutates balances or inventory.
