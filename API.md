# Al-Noor Mart POS & Inventory API Documentation (v1.0.0)

## Base URL
```
/api/v1
```

## Authentication
All endpoints except `POST /api/v1/auth/login` require a Sanctum Bearer Token in the HTTP Request Header:
```
Authorization: Bearer <your_sanctum_token>
```

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/login`
- **Description**: Authenticate user and receive API bearer token.
- **Request Body**:
```json
{
  "email": "cashier@alnoormart.com",
  "password": "password123"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 2,
      "name": "Mohammad Ali (Cashier)",
      "email": "cashier@alnoormart.com",
      "role": "cashier"
    },
    "token": "1|sanctum_token_string_here"
  }
}
```

### `POST /api/v1/auth/logout`
- **Description**: Revoke current bearer token.

### `GET /api/v1/auth/me`
- **Description**: Retrieve current authenticated user profile.

---

## 2. Dynamic Categories API

### `GET /api/v1/categories`
- **Query Params**: `search`, `status`, `per_page`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully.",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "name": "Sugar",
        "description": "Refined white and brown sugar",
        "status": "active",
        "products_count": 1
      }
    ]
  }
}
```

### `POST /api/v1/categories`
- **Request Body**:
```json
{
  "name": "Spices & Condiments",
  "description": "Turmeric, red chili, and mixed spices",
  "status": "active"
}
```

---

## 3. Product System API

### `GET /api/v1/products`
- **Query Params**: `q` (search name/SKU/barcode), `category_id`, `selling_mode`, `status`, `per_page`

### `POST /api/v1/products`
- **Request Body (Weight Mode Product)**:
```json
{
  "category_id": 3,
  "name": "Sugar (Chini)",
  "sku": "SUGAR-001",
  "barcode": "896000000001",
  "selling_mode": "weight",
  "base_unit": "kg",
  "base_price": 180.00,
  "purchase_price": 160.00,
  "opening_stock_kg": 50,
  "minimum_stock": 5000
}
```
- **Request Body (Quantity Mode Product)**:
```json
{
  "category_id": 6,
  "name": "Colgate Toothpaste 140g",
  "sku": "TOOTHPASTE-001",
  "selling_mode": "quantity",
  "base_unit": "piece",
  "base_price": 180.00,
  "purchase_price": 140.00,
  "opening_stock": 100,
  "minimum_stock": 10
}
```

---

## 4. Sales & POS Engine API

### `POST /api/v1/sales/calculate`
- **Description**: Non-persisted preview calculation for cashier POS cart.
- **Request Body**:
```json
{
  "items": [
    {
      "product_id": 1,
      "weight": 1,
      "weight_unit": "pao"
    },
    {
      "product_id": 1,
      "sale_mode": "weight",
      "amount": 100
    },
    {
      "product_id": 5,
      "sale_mode": "quantity",
      "quantity": 3
    }
  ]
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Cart calculation preview generated.",
  "data": {
    "items": [
      {
        "product_id": 1,
        "product_name": "Sugar (Chini)",
        "selling_mode": "weight",
        "unit_base_price": 180,
        "weight_grams": 250,
        "subtotal": 45,
        "total": 45
      },
      {
        "product_id": 1,
        "product_name": "Sugar (Chini)",
        "selling_mode": "weight",
        "unit_base_price": 180,
        "weight_grams": 555.556,
        "subtotal": 100,
        "total": 100
      },
      {
        "product_id": 5,
        "product_name": "Colgate Toothpaste 140g",
        "selling_mode": "quantity",
        "unit_base_price": 180,
        "quantity": 3,
        "subtotal": 540,
        "total": 540
      }
    ],
    "subtotal": 685,
    "total": 685
  }
}
```

### `POST /api/v1/sales`
- **Description**: Finalize sale atomically in DB transaction. Updates inventory, payments, and credit ledger.
- **Request Body**:
```json
{
  "idempotency_key": "POS-TXN-998822",
  "customer_id": null,
  "paid_amount": 685.00,
  "items": [
    {
      "product_id": 1,
      "weight": 1,
      "weight_unit": "pao"
    },
    {
      "product_id": 5,
      "quantity": 3
    }
  ],
  "payments": [
    {
      "payment_method": "cash",
      "amount": 685.00
    }
  ]
}
```

---

## 5. Sales Return API

### `POST /api/v1/returns`
- **Request Body**:
```json
{
  "sale_id": 1,
  "refund_payment_method": "cash",
  "reason": "Customer returned 1 toothpaste",
  "items": [
    {
      "sale_item_id": 2,
      "quantity": 1
    }
  ]
}
```

---

## 6. Daily Closing API

### `GET /api/v1/daily-closing/preview`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "closing_date": "2026-10-04",
    "opening_cash": 5000.00,
    "total_sales_amount": 12500.00,
    "cash_sales_amount": 9500.00,
    "credit_sales_amount": 3000.00,
    "total_customer_payments": 1500.00,
    "total_expenses": 400.00,
    "total_refunds": 180.00,
    "expected_cash": 15420.00
  }
}
```

### `POST /api/v1/daily-closing`
- **Request Body**:
```json
{
  "actual_cash": 15420.00,
  "notes": "Shift closed smoothly."
}
```

---

## 7. Dashboard API

### `GET /api/v1/dashboard`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "today_sales": 12500.00,
    "today_transactions": 24,
    "today_expenses": 400.00,
    "outstanding_credit": 15400.00,
    "low_stock_products": [],
    "top_selling_products": []
  }
}
```
