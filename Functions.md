# Al-Noor Mart - System Functions & Runtime Capabilities

This document provides a comprehensive reference of all functional capabilities, business workflows, and runtime features executed by the **Al-Noor Mart POS, Inventory, Sales, Credit (Khata), Expense & Reporting System**.

---

## 1. Authentication & Session Management

- **Sanctum Token-Based Authentication**:
  - Secure API authentication using Laravel Sanctum bearer tokens.
  - Endpoints for `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me`.
- **Role-Based Access Control (RBAC)**:
  - **Owner Role**: Full access to dashboard KPIs, product creation/editing, inventory adjustments, expense logging, credit management, daily shift closing, and shift reopening.
  - **Cashier Role**: Access to Point of Sale (POS) billing, customer search, weight/quantity cart calculations, order checkout, and printable receipt generation.
- **Graceful Unauthenticated Session Handling**:
  - API middleware automatically returns `401 Unauthorized` JSON responses without HTML redirects.

---

## 2. Point of Sale (POS) & Multi-Mode Cart Engine

- **Dual Selling Modes**:
  - **Quantity Mode (`quantity`)**: Sold in piece/unit counts (e.g., Colgate Toothpaste, Lux Soap, Biscuits).
  - **Weight Mode (`weight`)**: Sold by weight with internal canonical storage in **Grams** (`DECIMAL(12,3)`) for high precision (e.g., Sugar, Basmati Rice, Flour, Daal).
- **Pakistani Weight & Price Calculation Engine**:
  - **Weight in Grams**: Input exact weight in grams (e.g., `500g` of Rice @ PKR 320/kg = PKR 160.00).
  - **Weight in Kilograms**: Input fractional kg (e.g., `1.5 kg` of Sugar @ PKR 180/kg = PKR 270.00).
  - **Pakistani Pao Conversion**: Native conversion where `1 Pao = 250 grams` and `2 Pao = 500 grams` (e.g., `1 Pao` of Sugar = PKR 45.00).
  - **Target Amount Selling ("Paise ki Chini")**: Cashier enters target rupee amount (e.g., "PKR 100 worth of Sugar" @ PKR 180/kg). The backend authoritatively calculates exact weight:
    $$\text{Calculated Grams} = \frac{\text{Target Amount}}{\text{Price per KG}} \times 1000 = \frac{100}{180} \times 1000 = 555.556\text{ grams}$$
- **Instant Product Search & Barcode Scanning**:
  - Instant filtering by Product Name, SKU, or Barcode scan (`GET /api/v1/products?q=...`).
- **Authoritative Backend Cart Calculation (`POST /api/v1/sales/calculate`)**:
  - Real-time preview calculation verifying stock availability and calculating totals server-side.
- **Historical Price Snapshot Protection**:
  - At checkout, each sale item records `product_name_snapshot` and `unit_base_price_snapshot` in `sale_items`. Subsequent product master price revisions never alter historical sales data or return amounts.
- **Idempotent Checkout Protection**:
  - Submissions support `X-Idempotency-Key` headers and `idempotency_key` payloads to prevent accidental double-billing or duplicate stock deductions.

---

## 3. Multi-Method Checkout & Printable Receipts

- **Flexible Payment Options**:
  - **Cash Payment**: Cashier inputs customer tender amount; system automatically computes change return.
  - **Credit (Udhaar) Payment**: Sale linked to customer profile; unpaid balance posted to customer's Khata balance.
  - **Online/Bank Payment**: Support for Bank Transfer, EasyPaisa, and JazzCash.
  - **Split Payment**: Support for combining Cash + Online + Credit in a single transaction.
- **Printable Thermal Receipts**:
  - Post-checkout printable receipt modal formatted for standard **80mm / 58mm thermal printers**.
  - Includes:
    - Shop Header: **Al-Noor Mart**
    - Invoice Reference Number & Timestamp
    - Cashier Name & Customer Name (if credit sale)
    - Itemized breakdown (Name, Sold Quantity/Weight, Unit Rate, Total)
    - Subtotal & Grand Total
    - Cash Paid, Change Returned, and Customer Remaining Credit Balance
    - Footer: *"Thank you for shopping at Al-Noor Mart!"*
  - One-click native print invocation (`window.print()`).

---

## 4. Product Catalog & Inventory Management

- **Dynamic Category Management**:
  - Full CRUD operations for product categories (`GET/POST /api/v1/categories`).
- **Product Catalog Management**:
  - Create and update products with Barcode, SKU, Selling Mode (`quantity` vs `weight`), Unit Cost Price, Unit Selling Price, and Low Stock Alert Threshold.
  - Opening stock initialization in Kilograms/Grams for weight items or Units for quantity items.
- **Immutable Inventory Movements Audit (`inventory_movements`)**:
  - Every stock change creates an audit entry with type (`sale`, `purchase`, `return`, `adjustment`), quantity/grams change, and user ID.
- **Pessimistic Locking & Stock Safeguards**:
  - Database row locking (`lockForUpdate()`) ensures zero race conditions during concurrent sales checkout.
  - Low stock warning alerts when inventory falls below minimum threshold.

---

## 5. Customer Credit (Khata / Udhaar) Ledger

- **Customer Account Directory**:
  - Create and manage customer profiles with Name, Phone Number, Address, and Credit Limit (`GET/POST /api/v1/customers`).
- **Double-Entry Credit Ledger (`credit_ledgers`)**:
  - **Debit Entries**: Created automatically on credit sales, increasing customer's `current_balance`.
  - **Credit Entries**: Created when customer makes a debt payment (`POST /api/v1/customers/{id}/payments`), decreasing `current_balance`.
- **Customer Statement & History**:
  - Complete statement tracking all invoice debits and payment credits per customer.

---

## 6. Expense Tracking & Cash Flow

- **Categorized Expense Management**:
  - Log operational expenses (`POST /api/v1/expenses`) under categories: Shop Rent, Electricity Bill, Staff Salary, Tea/Refreshments, Transportation, Repairs, and Miscellaneous.
- **Payment Source Tracking**:
  - Track whether expenses were paid from Register Cash float or Online/Bank account.
- **Daily Expense Reporting**:
  - Expense totals automatically factored into daily register cash reconciliation and net profit calculations.

---

## 7. Sales Returns & Refunds Engine

- **Itemized Return Processing (`POST /api/v1/returns`)**:
  - Process partial or full returns against original sale invoices.
- **Snapshot Price Refund Calculation**:
  - Refunds calculated strictly based on original sale snapshot prices.
- **Refund Payment Options**:
  - Refund in Cash or Credit Balance adjustment.
- **Automatic Inventory Restoration**:
  - Returned items automatically re-added to inventory with `return` movement log.

---

## 8. Daily Shift & Register Closing System

- **Shift Closing Preview (`GET /api/v1/daily-closing/preview`)**:
  - Automated calculation of expected register cash:
    $$\text{Expected Cash} = \text{Opening Cash} + \text{Cash Sales} + \text{Customer Debt Cash Payments} - \text{Cash Expenses} - \text{Cash Refunds}$$
- **Register Closing Finalization (`POST /api/v1/daily-closing`)**:
  - Cashier enters actual counted cash.
  - System logs exact cash variance ($\text{Actual Cash} - \text{Expected Cash}$), flagging overages or shortages.
- **Shift Security**:
  - Enforces one shift closing per business date; Owner override available for reopening.

---

## 9. Real-Data Analytics & Financial Reports

- **Dashboard KPI Metrics (`GET /api/v1/dashboard`)**:
  - Today's Total Sales Volume (PKR).
  - Today's Total Transaction Count.
  - Today's Total Expenses.
  - Total Outstanding Customer Credit (Khata Balance across all customers).
  - Reorder Warning List (Low stock products).
  - Top Selling Products Ranking.
- **Daily Financial Summary Report (`GET /api/v1/reports/daily-summary`)**:
  - Gross Sales, Net Profit (Gross Sales - Cost of Goods Sold - Expenses).
  - Payment Method Breakdown (Cash vs Credit vs Online).
  - Category-wise sales volume distribution.
  - **Zero Mock Data**: 100% generated from real live PostgreSQL database records.

---

## 10. Core Business Logic & Architecture Constraints

1. **Tax & Discount Exclusion Directive**:
   - In accordance with shop specification, Discount and Tax fields are completely excluded.
   - Formula: $\text{Grand Total} = \text{Subtotal}$.
2. **FBR / PRAL Exemption**:
   - Private wholesale/retail operation; no government tax tokens, fake FBR QR codes, or fake invoice numbers.
3. **Database Integrity**:
   - Built on Laravel 11 + PostgreSQL 18 with foreign key integrity, transactions, and full test suite validation.
