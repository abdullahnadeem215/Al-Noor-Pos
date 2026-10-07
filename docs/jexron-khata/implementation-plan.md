# Jexron Khata - Implementation Plan & Roadmap

## Overview & Safe Development Protocol

This document defines the exact step-by-step implementation order across Phases 1 through 30.

---

## Phase Breakdown & Execution Sequence

### Phase 1: Backup and Safe Modification
- Set up database backup script/procedure.
- Create Git branch: `feature/jexron-khata-v2`.
- Preserve existing records and ensure zero data loss.

### Phase 2 & 21: Product System & Price List
- Add `wholesale_price` to `products` schema and model.
- Update product creation/editing API and forms to include Purchase Price, Wholesale Price, and Selling Price.
- Update Product list page with Search, Filter, Print Price List, Download Price List.

### Phase 3, 4, 5, 6: Khaata Invoice, Price Snapshots, & Permanent Storage
- Refactor invoice creation workflow: Customer -> New Khaata Invoice -> Product Search -> Inventory Selection -> Quantity -> Price Selection -> Atomic DB Transaction.
- Enforce snapshot pricing (`product_id`, `product_name_snapshot`, `sku_snapshot`, `unit_snapshot`, `quantity`, `unit_price`, `line_total`).
- Ensure invoice generation formats invoice numbers permanently as `KH-YYYYMMDD-XXXX`.
- Verify historical price immutability (changing current product price never alters existing saved invoices).

### Phase 7, 8, 9: Receipt Viewing, Download, & Printing
- Ensure `View Receipt` retrieves existing `Sale` record without recalculations or DB mutations.
- Implement `[Download PDF]` and `[Print]` actions for saved Khaata invoices.
- Confirm that viewing, downloading, or printing causes **zero** stock deductions, **zero** ledger modifications, and **zero** new invoice generation.

### Phase 10, 11, 12, 13: Customer Ledger, Payments, & Date Filtering
- Structure Customer Ledger timeline with columns: Date, Transaction #, Type, Description, Debit, Credit, Balance, Actions.
- Implement Customer Payment workflow (`Receive Payment`) saving permanent `PAY-YYYYMMDD-XXXX` payment receipts.
- Add Date Range Filter (Today, Yesterday, This Week, This Month, Custom Date Range).

### Phase 14: Daily Receipts
- Implement `[Today's Transactions]` report view displaying all Khaata activity performed on a selected date.

### Phase 15 & 16: Inventory & Database Transactions
- Connect Khaata sales to inventory stock movements.
- Draft/Preview: 0 stock deduction.
- Finalized: EXACTLY 1 stock deduction inside DB transaction (`DB::transaction`).
- Rollback on failure.

### Phase 17 & 18: Real Database Visibility & pgAdmin Documentation
- Document PostgreSQL connection parameters.
- Provide step-by-step pgAdmin inspection instructions for all core tables.

### Phase 19: Developer Database Explorer
- Create developer-only read-only DB Explorer endpoint and frontend UI view.
- Strict read-only query scope, disabled by default in production.

### Phase 20: Focused Dashboard
- Update Dashboard UI and API metrics to focus purely on Khaata business goals:
  - Today's Credit Sales
  - Payments Received Today
  - Total Outstanding Khaata
  - Total Customers
  - Total Products
  - Recent Transactions & Quick Actions

### Phase 22: Customer Statement
- Add `[Print Statement]` and `[Download Statement]` for customer accounts.

### Phase 23: Audit & Security
- Guard finalized invoices from unauthorized edits. Log all sensitive operations in audit logs.

### Phase 24, 25, 26: Data Preservation & Future POS Readiness
- Retain all legacy data safely.
- Exclude unnecessary POS bloat (FBR, PRAL, Tax, Loyalty).
- Keep core architecture modular for future POS expansion.

### Phase 27, 28, 29, 30: E2E Verification & Testing
- Execute full Sugar test scenario (Rs.170 purchase, Rs.180 wholesale, Rs.190 selling, 100kg initial stock -> 10kg sale -> Rs.1,900 total -> price change to Rs.200 -> verify invoice remains Rs.190).
- Execute Payment test scenario (Rs.1,900 balance -> Rs.1,000 payment -> PAY-YYYYMMDD-XXXX receipt -> Rs.900 remaining balance -> verify immutability).
- Complete final checklist verification.
