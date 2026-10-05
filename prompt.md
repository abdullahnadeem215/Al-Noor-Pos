# Lovable.dev Master Prompt: Al-Noor Mart POS & Business OS Frontend

Copy and paste the entire prompt below into **Lovable.dev** (or any AI frontend builder) to generate a complete, production-ready, fully responsive React/Next.js frontend folder tailored for **Al-Noor Mart**.

---

```markdown
Build a modern, high-performance, dark/light themed Point of Sale (POS), Inventory, Khata (Customer Credit), Expense, and Reporting Frontend Web Application for "Al-Noor Mart" (a retail and wholesale grocery shop in Pakistan). 

The application must strictly integrate with an existing Laravel 11 RESTful API backend running on `http://127.0.0.1:8000/api/v1`.

---

### TECH STACK & UI RULES
- **Framework**: React 19 / Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI / Radix UI components, Framer Motion for smooth transitions, Lucide-react icons.
- **State & API**: Axios / Fetch API client configured with Sanctum Bearer Tokens stored in LocalStorage/Cookies.
- **Notifications**: Toast notifications (Sonner or React Hot Toast) for all API successes and error handling.
- **Design Persona**: Clean, fast, retail-optimized interface for touchscreens, desktop monitors, and barcode scanners. Default to high contrast with clear status indicators.

---

### CORE FRONTEND FUNCTIONALITIES & SCREENS TO BUILD

#### 1. AUTHENTICATION & SESSION MANAGEMENT (`/login`)
- **Login Card**: Clean form accepting Email (`owner@alnoormart.com` / `cashier@alnoormart.com`) and Password.
- **Sanctum Token Handling**: Upon success, save token and user profile in state/storage and set `Authorization: Bearer <token>` header on all requests.
- **Top Navigation Bar**:
  - Store Logo & Name: **Al-Noor Mart**
  - Navigation Tabs: POS Billing, Products & Inventory, Customer Khata, Expenses, Daily Shift Closing, Reports & Dashboard.
  - Active User Badge (Cashier vs Owner), Shift Status Indicator, Quick Lock, and Logout button.

---

#### 2. POS TERMINAL & BILLING SCREEN (`/pos`)
- **Fast Product Search & Barcode Auto-Focus Bar**:
  - Global hotkey auto-focus search input (`q` param) searching by Product Name, SKU, or Barcode scan (`GET /api/v1/products?q=...`).
  - Category Filter Chips (All, Sugar, Rice, Pulses/Daal, Spices, Beverages, Snacks, Toiletries).
- **Product Card Grid**:
  - Displays product image/icon, name, stock badge (Green = Available, Red = Low Stock), selling mode badge (`Weight` vs `Qty`), and base selling price.
- **DUAL SELLING MODE CONTROLS & WEIGHT MODAL**:
  - **Quantity Items (`selling_mode: "quantity"`)**: Direct 1-click add to cart, inline `+` / `-` quantity controls.
  - **Weight Items (`selling_mode: "weight"`) - PAKISTANI WEIGHT CALCULATOR**:
    - Clicking a weight item opens an interactive **Pakistani Weight & Price Calculator Modal**:
      1. **Weight in Grams Tab**: Input grams (e.g. `250g`, `500g`, `750g`).
      2. **Weight in Kilograms Tab**: Input kg (e.g. `0.5 kg`, `1.5 kg`, `2.5 kg`).
      3. **Pakistani Pao Quick Buttons**: Quick selector buttons for `1 Pao (250g)`, `2 Pao (500g)`, `3 Pao (750g)`, `4 Pao (1000g / 1kg)`.
      4. **Target Amount PKR Tab ("Paise ki Chini")**: Input field where cashier types customer's requested Rupee amount (e.g., "PKR 100 ki Chini"). The modal instantly calculates and displays exact target weight in grams:
         $$\text{Calculated Grams} = \left(\frac{\text{Target Amount}}{\text{Price per KG}}\right) \times 1000$$
         *(Example: PKR 100 of Sugar @ PKR 180/kg shows `555.56g` for PKR 100.00).*
- **Cart Side Panel**:
  - List of cart items showing: Name, Selling Mode tag, Weight/Quantity, Unit Rate, Line Subtotal, and Delete button.
  - Subtotal & Grand Total display (**Total = Subtotal**, No Tax or Discount fields per shop rules).
  - Customer Selector Dropdown: Walk-in Customer (Default) or search registered Khata Customer.
  - Payment Method Selector: Cash, Credit (Udhaar), Online (Bank/EasyPaisa/JazzCash), or Split Payment.
  - Cash Tendered & Change Return Live Calculator for Cash sales.
  - **"Checkout & Complete Sale" Button**: Sends payload to `POST /api/v1/sales` with `idempotency_key` and opens Thermal Receipt Modal upon success.

---

#### 3. PRINTABLE THERMAL RECEIPT MODAL (`/pos` Post-Checkout)
- Renders an auto-opening modal containing an **80mm & 58mm Thermal Printer Friendly Receipt**:
  - **Header**: **Al-Noor Mart** (Address & Phone Number)
  - Invoice Ref # (e.g. `INV-20261004-001`), Date & Time, Cashier Name.
  - Customer Name (if credit sale).
  - **Items Table**: Name | Qty / Weight | Rate | Total Amount.
  - **Financial Summary**:
    - Grand Total (PKR)
    - Cash Tendered & Change Returned (if Cash)
    - Customer Remaining Khata Credit Balance (if Credit)
  - **Footer**: *"Thank you for shopping at Al-Noor Mart!"*
- Includes a clean **"Print Receipt"** button calling `window.print()` with CSS `@media print` rules hiding surrounding web UI.

---

#### 4. PRODUCT CATALOG & INVENTORY MANAGEMENT (`/products`)
- **Product Directory Table**: Search, filter by Category, Stock Status (In Stock, Low Stock, Out of Stock), and Selling Mode.
- **Add / Edit Product Modal**:
  - Fields: Name, SKU, Barcode, Category ID, Selling Mode (`quantity` vs `weight`), Unit Cost Price, Base Selling Price (per unit/kg), Low Stock Alert Threshold.
  - Opening Stock Setup: Input in Kg/Grams for weight products or Units for quantity products.
- **Category Management Dialog**: Create and edit categories (`POST /api/v1/categories`).
- **Inventory Audit History Modal**: View immutable stock movements log (`inventory_movements`) per product.

---

#### 5. CUSTOMER KHATA (CREDIT LEDGER) SCREEN (`/customers`)
- **Customer List**: Name, Phone, Address, Credit Limit, and Current Outstanding Balance (PKR).
- **Customer Detail & Ledger Drawer**:
  - Displays customer profile details and double-entry transaction ledger table:
    - Date | Transaction Type (Sale Debit vs Debt Payment Credit) | Invoice Ref / Receipt | Amount | Running Balance.
- **"Receive Payment" Modal**: Log customer cash/online debt payments (`POST /api/v1/customers/{id}/payments`).

---

#### 6. EXPENSE TRACKING SCREEN (`/expenses`)
- **Expense Log Table**: Date, Category (Rent, Electricity, Staff Salary, Tea/Refreshment, Transport, Repairs, Misc), Amount (PKR), Payment Source (Register Cash vs Bank), Description.
- **"Add Expense" Modal**: Record new shop operational expenses (`POST /api/v1/expenses`).

---

#### 7. DAILY SHIFT & REGISTER CLOSING SCREEN (`/closing`)
- **Register Pre-Closing Preview Card** (`GET /api/v1/daily-closing/preview`):
  - Displays Opening Cash Float, Total Cash Sales, Customer Debt Cash Payments, Cash Expenses, Cash Refunds, and Expected Cash in Register.
- **Counted Cash Entry**: Input field for Cashier to enter actual physical cash counted.
- **Variance Analysis Badge**:
  - Over / Short calculation: $\text{Actual Cash} - \text{Expected Cash}$.
  - Visual status (Green = Balanced, Red = Shortage, Yellow = Overage).
- **"Submit Register Closing" Button** (`POST /api/v1/daily-closing`).

---

#### 8. DASHBOARD & REAL-DATA REPORTS SCREEN (`/dashboard`)
- **Metric KPI Cards**:
  - Today's Sales (PKR)
  - Today's Transaction Count
  - Today's Expenses (PKR)
  - Total Outstanding Customer Khata Debt (PKR)
- **Low Stock Reorder Warning Widget**: Lists products at or below minimum stock threshold.
- **Top Selling Products List**: Ranking of top items sold today.
- **Daily Financial Summary Report Tab** (`GET /api/v1/reports/daily-summary`): Real-data report showing Gross Sales, Net Profit (Gross Sales - COGS - Expenses), and Payment Method distribution.

---

### BACKEND API ENDPOINTS REFERENCE
- `POST /api/v1/auth/login`
- `GET /api/v1/products?q=...&category_id=...`
- `POST /api/v1/products`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `POST /api/v1/sales/calculate` (Cart Preview)
- `POST /api/v1/sales` (Checkout)
- `POST /api/v1/returns` (Sales Return)
- `GET /api/v1/customers`
- `POST /api/v1/customers/{id}/payments`
- `GET/POST /api/v1/expenses`
- `GET /api/v1/daily-closing/preview`
- `POST /api/v1/daily-closing`
- `GET /api/v1/dashboard`
- `GET /api/v1/reports/daily-summary`
```
