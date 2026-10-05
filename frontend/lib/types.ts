// ===================== AUTH =====================
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'cashier';
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ===================== CATEGORIES =====================
export interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
}

// ===================== PRODUCTS =====================
export type SellingMode = 'quantity' | 'weight';

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  category?: Category;
  selling_mode: SellingMode;
  unit_cost_price: number;
  base_selling_price: number;
  stock_quantity: number; // units for quantity mode, grams for weight mode
  low_stock_threshold: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'opening';
  quantity: number;
  reference: string;
  notes?: string;
  created_at: string;
  user?: string;
}

// ===================== CART & SALES =====================
export interface CartItem {
  id: string;
  product_id: number;
  name: string;
  selling_mode: SellingMode;
  quantity: number; // for quantity mode: count, for weight mode: grams
  unit_price: number; // per unit for quantity, per kg for weight
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'credit' | 'online' | 'split';

export interface SaleItemPayload {
  product_id: number;
  name: string;
  selling_mode: SellingMode;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SalePayload {
  idempotency_key: string;
  customer_id: number | null;
  items: SaleItemPayload[];
  payment_method: PaymentMethod;
  cash_tendered?: number;
  change_returned?: number;
  subtotal: number;
  grand_total: number;
  cashier_name: string;
}

export interface SaleResponse {
  id: number;
  invoice_ref: string;
  date: string;
  cashier_name: string;
  customer_name?: string;
  items: SaleItemPayload[];
  subtotal: number;
  grand_total: number;
  payment_method: PaymentMethod;
  cash_tendered?: number;
  change_returned?: number;
  customer_balance?: number;
}

// ===================== CUSTOMERS =====================
export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  credit_limit: number;
  outstanding_balance: number;
  created_at?: string;
}

export interface LedgerEntry {
  id: number;
  date: string;
  type: 'sale_debit' | 'payment_credit';
  invoice_ref: string;
  amount: number;
  running_balance: number;
  description?: string;
}

export interface PaymentPayload {
  amount: number;
  method: 'cash' | 'online';
  reference?: string;
  notes?: string;
}

// ===================== EXPENSES =====================
export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'staff_salary'
  | 'tea_refreshment'
  | 'transport'
  | 'repairs'
  | 'misc';

export interface Expense {
  id: number;
  date: string;
  category: ExpenseCategory;
  amount: number;
  payment_source: 'register_cash' | 'bank';
  description: string;
  created_at?: string;
}

export interface ExpensePayload {
  date: string;
  category: ExpenseCategory;
  amount: number;
  payment_source: 'register_cash' | 'bank';
  description: string;
}

// ===================== DAILY CLOSING =====================
export interface DailyClosingPreview {
  date: string;
  opening_float: number;
  total_cash_sales: number;
  customer_debt_payments_cash: number;
  cash_expenses: number;
  cash_refunds: number;
  expected_cash: number;
  total_sales: number;
  total_online_sales: number;
  total_credit_sales: number;
  transaction_count: number;
}

export interface DailyClosingPayload {
  date: string;
  counted_cash: number;
  expected_cash: number;
  variance: number;
  notes?: string;
}

// ===================== DASHBOARD & REPORTS =====================
export interface DashboardData {
  today_sales: number;
  today_bills?: number;
  today_transaction_count: number;
  cash_today?: number;
  credit_today?: number;
  online_today?: number;
  returns_today?: number;
  average_bill_value?: number;
  today_expenses: number;
  total_outstanding_debt: number;
  outstanding_credit?: number;
  low_stock_count?: number;
  low_stock_products: Product[];
  top_selling_products: TopProduct[];
}

export interface TopProduct {
  product_id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export interface DailySummaryReport {
  date: string;
  gross_sales: number;
  cogs: number;
  expenses: number;
  net_profit: number;
  payment_method_distribution: {
    cash: number;
    credit: number;
    online: number;
  };
  transaction_count: number;
}
