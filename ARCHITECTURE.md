# Al-Noor Mart POS & Inventory Backend - Architecture Document

## 1. Executive Overview
This document outlines the software architecture for the Al-Noor Mart POS, Inventory, Sales, Purchase, Credit Ledger, Expense, and Business Intelligence Backend API built with Laravel 11, PHP 8.4, and PostgreSQL 18.

The system is designed as an **API-First Clean Modular Laravel Monolith**, fully decoupled from any frontend presentation layer.

## 2. Core Architectural Principles
1. **API-First & Frontend Independence**: No Blade, Inertia, Livewire, or JS framework templates. All communication happens via RESTful JSON APIs (`/api/v1/*`).
2. **Authoritative Backend**: Price calculation, weight conversion, stock validation, tax computation, discount rules, and authorization are strictly computed and enforced by the backend. Frontend calculated values are never trusted.
3. **Thin Controllers & Rich Service Layer**: Controllers sanitize input via Form Requests, delegate complex domain logic to specialized Service classes, and format output using API Resources.
4. **Transactional Safety & Concurrency**: All multi-step inventory, sales, purchases, returns, ledger entries, and daily closings execute within DB transactions with row-level locks (`lockForUpdate()`).
5. **Snapshot Integrity**: Historical transactions (sales items, purchase items) store immutable snapshots of product names and base prices at the time of sale.
6. **Deterministic Financial & Weight Calculations**: Money is stored as `DECIMAL(12,2)` and weight as `DECIMAL(12,3)` (in grams). Binary floating-point arithmetic is strictly forbidden.

## 3. Directory & Code Structure
```
app/
├── Http/
│   ├── Controllers/Api/V1/
│   │   ├── AuthController.php
│   │   ├── CategoryController.php
│   │   ├── ProductController.php
│   │   ├── InventoryController.php
│   │   ├── PurchaseController.php
│   │   ├── SaleController.php
│   │   ├── ReturnController.php
│   │   ├── CustomerController.php
│   │   ├── SupplierController.php
│   │   ├── CreditLedgerController.php
│   │   ├── ExpenseController.php
│   │   ├── DailyClosingController.php
│   │   ├── ReportController.php
│   │   ├── DashboardController.php
│   │   ├── AuditLogController.php
│   │   └── SettingController.php
│   ├── Requests/Api/V1/...
│   ├── Resources/Api/V1/...
│   └── Middleware/
│       ├── CheckRole.php
│       └── IdempotencyMiddleware.php
├── Models/
│   ├── User.php
│   ├── Category.php
│   ├── Product.php
│   ├── ProductPriceHistory.php
│   ├── Customer.php
│   ├── CreditLedger.php
│   ├── Supplier.php
│   ├── Purchase.php
│   ├── PurchaseItem.php
│   ├── Sale.php
│   ├── SaleItem.php
│   ├── SalePayment.php
│   ├── SalesReturn.php
│   ├── SalesReturnItem.php
│   ├── InventoryMovement.php
│   ├── ExpenseCategory.php
│   ├── Expense.php
│   ├── DailyClosing.php
│   ├── AuditLog.php
│   └── Setting.php
├── Services/
│   ├── WeightCalculationService.php
│   ├── ProductService.php
│   ├── CategoryService.php
│   ├── InventoryService.php
│   ├── PurchaseService.php
│   ├── SaleService.php
│   ├── ReturnService.php
│   ├── CreditLedgerService.php
│   ├── ExpenseService.php
│   ├── DailyClosingService.php
│   ├── ReportService.php
│   ├── DashboardService.php
│   └── AuditService.php
├── Enums/
│   ├── UserRole.php
│   ├── SellingMode.php
│   ├── StockUnit.php
│   ├── PaymentMethod.php
│   ├── PaymentStatus.php
│   ├── SaleStatus.php
│   ├── MovementType.php
│   └── LedgerType.php
├── Exceptions/
│   ├── InsufficientStockException.php
│   ├── InvalidSellingModeException.php
│   └── DailyClosingAlreadyExistsException.php
└── Support/
    └── ApiResponse.php
```

## 4. API Standardization & Response Format
All API endpoints follow a unified response layout:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Sale processed successfully.",
  "data": {
    "invoice_number": "INV-20261004-0001",
    "total": 540.00
  }
}
```

### Error Response (`400 Bad Request`, `422 Unprocessable Entity`, `403 Forbidden`, `500 Internal Error`)
```json
{
  "success": false,
  "message": "Insufficient stock for product Sugar.",
  "errors": {
    "product_id": [
      "Requested 5000g, but only 2500g available."
    ]
  }
}
```

## 5. Security & Authentication Strategy
- **Authentication**: Laravel Sanctum bearer tokens for API requests.
- **Role-Based Access Control (RBAC)**: Supported roles: `owner`, `cashier`, `manager`, `inventory`, `accountant`.
- **Policy Authorization**: Gate policies guard endpoints (e.g., Cashiers cannot manage settings or perform daily re-openings; Owners can access all features).
