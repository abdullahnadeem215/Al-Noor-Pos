// ===================== AUTH =====================
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'cashier' | 'admin';
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
  category_id?: number;
  category?: Category;
  selling_mode: SellingMode;
  stock_unit?: string;
  base_unit?: string;
  purchase_price?: number;
  wholesale_price?: number;
  base_price?: number; // Selling Price
  unit_cost_price?: number; // fallback
  base_selling_price?: number; // fallback
  current_stock?: number;
  opening_stock?: number;
  opening_stock_kg?: number;
  minimum_stock?: number;
  stock_quantity?: number; // fallback for mock
  low_stock_threshold?: number; // fallback for mock
  status?: 'active' | 'inactive' | string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  movement_type?: string;
  type?: string;
  quantity_or_grams?: number;
  quantity?: number;
  stock_before?: number;
  stock_after?: number;
  reference_type?: string;
  reference_id?: number;
  reference?: string;
  notes?: string;
  created_at: string;
  user_id?: number;
  user?: string;
}

// ===================== CART & SALES =====================
export type PaymentMethod = 'cash' | 'credit' | 'online' | string;

export interface CartItem {
  id: string;
  product_id: number;
  name: string;
  sku: string;
  unit: string;
  selling_mode: SellingMode;
  quantity: number; // count for quantity, weight_grams for weight
  unit_price: number; // custom / selected price
  price_type: 'selling' | 'wholesale' | 'custom';
  subtotal: number;
}

export interface SaleItemPayload {
  product_id: number;
  product_name_snapshot?: string;
  sku_snapshot?: string;
  unit_snapshot?: string;
  selling_mode: SellingMode;
  unit_price: number;
  quantity?: number;
  weight_grams?: number;
  amount?: number;
  subtotal?: number;
  total?: number;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot?: string;
  unit_snapshot?: string;
  selling_mode: SellingMode;
  unit_base_price_snapshot: number;
  quantity?: number;
  weight_grams?: number;
  subtotal: number;
  total: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer?: Customer;
  subtotal: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  sale_status: string;
  cashier_id?: number;
  cashier?: User;
  notes?: string;
  created_at: string;
  items: SaleItem[];
}

// ===================== CUSTOMERS & LEDGER =====================
export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  opening_balance?: number;
  current_balance?: number;
  credit_limit?: number; // fallback for mock
  outstanding_balance?: number; // fallback for mock
  status?: string;
  created_at?: string;
}

export interface CreditLedger {
  id: number;
  customer_id: number;
  sale_id?: number;
  sale?: Sale;
  transaction_type: 'debit' | 'credit' | 'opening_balance' | 'adjustment';
  amount: number;
  balance_after: number;
  reference_number: string;
  notes?: string;
  created_at: string;
  created_by?: number;
  creator?: User;
}

export interface LedgerEntry {
  id: number;
  date: string;
  transaction_number?: string;
  type?: string;
  description?: string;
  debit?: number;
  credit?: number;
  balance?: number;
  invoice_ref?: string;
  amount?: number;
  running_balance?: number;
  action_type?: string;
}

// ===================== EXPENSES & CLOSING =====================
export type ExpenseCategory = 'rent' | 'electricity' | 'staff_salary' | 'tea_refreshment' | 'transport' | 'repairs' | 'misc' | string;

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  payment_source?: string;
}

export interface ExpensePayload {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  payment_source?: string;
}

export interface DailyClosingPreview {
  date: string;
  opening_float?: number;
  total_cash_sales?: number;
  customer_debt_payments_cash?: number;
  cash_expenses?: number;
  cash_refunds?: number;
  expected_cash?: number;
  total_sales?: number;
  total_online_sales?: number;
  total_credit_sales?: number;
  transaction_count?: number;
  cash_sales?: number;
  credit_sales?: number;
  payments_received?: number;
  expenses?: number;
  closing_balance?: number;
}

export interface DailyClosingPayload {
  date: string;
  notes?: string;
  counted_cash?: number;
  expected_cash?: number;
  variance?: number;
}

export interface TopProduct {
  id: number;
  name: string;
  total_quantity: number;
  total_revenue: number;
}

// ===================== DASHBOARD & REPORTS =====================
export interface DashboardSummary {
  today_credit_sales: number;
  payments_received_today: number;
  total_outstanding_khaata: number;
  total_customers: number;
  total_products: number;
  today_sales: number;
  recent_transactions: Sale[];
  recent_payments: CreditLedger[];
}

export interface DashboardData {
  summary?: DashboardSummary;
  today_sales?: number;
  today_transaction_count?: number;
  today_expenses?: number;
  total_outstanding_debt?: number;
  low_stock_products?: Product[];
  top_selling_products?: any[];
  top_products?: TopProduct[];
}

export interface DailySummaryReport {
  date: string;
  gross_sales?: number;
  cogs?: number;
  expenses?: number;
  net_profit?: number;
  payment_method_distribution?: any;
  transaction_count?: number;
  total_transactions?: number;
  total_amount?: number;
}

export interface SaleResponse {
  id?: number;
  invoice_ref?: string;
  date?: string;
  cashier_name?: string;
  customer_name?: string;
  items?: any[];
  subtotal?: number;
  total?: number;
  grand_total?: number;
  discount_amount?: number;
  paid_amount?: number;
  due_amount?: number;
  payment_method?: string;
  cash_tendered?: number;
  change_returned?: number;
  customer_balance?: number;
  sale?: Sale;
  message?: string;
}
