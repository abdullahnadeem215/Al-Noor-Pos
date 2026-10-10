import api from './api';
import type {
  AuthResponse,
  Category,
  Product,
  Customer,
  CreditLedger,
  Expense,
  ExpensePayload,
  DailyClosingPreview,
  DailyClosingPayload,
  DashboardSummary,
  InventoryMovement,
  Sale,
} from './types';

// ===================== AUTH =====================
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post('/auth/login', { email, password });
  const data = res.data.data || res.data;
  if (data.token) {
    localStorage.setItem('alnoor_token', data.token);
    localStorage.setItem('alnoor_user', JSON.stringify(data.user));
  }
  return data;
}

// ===================== PRODUCTS =====================
export async function fetchProducts(params?: {
  q?: string;
  category_id?: number;
  per_page?: number;
}): Promise<{ data: Product[]; total?: number }> {
  const res = await api.get('/products', { params });
  const raw = res.data.data || res.data;
  if (Array.isArray(raw)) {
    return { data: raw };
  }
  return { data: raw.data || [], total: raw.total };
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const res = await api.post('/products', payload);
  return res.data.data || res.data;
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<Product> {
  const res = await api.put(`/products/${id}`, payload);
  return res.data.data || res.data;
}

export async function deleteProduct(id: number): Promise<boolean> {
  await api.delete(`/products/${id}`);
  return true;
}

// ===================== CATEGORIES =====================
export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get('/categories');
  const raw = res.data.data || res.data;
  return Array.isArray(raw) ? raw : (raw.data || []);
}

export async function createCategory(payload: { name: string; description?: string }): Promise<Category> {
  const res = await api.post('/categories', payload);
  return res.data.data || res.data;
}

// ===================== INVENTORY MOVEMENTS =====================
export async function fetchInventoryMovements(productId?: number): Promise<InventoryMovement[]> {
  const url = productId ? `/inventory/movements?product_id=${productId}` : '/inventory/movements';
  const res = await api.get(url);
  const raw = res.data.data || res.data;
  return Array.isArray(raw) ? raw : (raw.data || []);
}

// ===================== SALES / KHAATA INVOICES =====================
export async function calculateSale(payload: any): Promise<any> {
  const res = await api.post('/sales/calculate', payload);
  return res.data.data || res.data;
}

export async function createSale(payload: any): Promise<Sale> {
  const res = await api.post('/sales', payload);
  return res.data.data || res.data;
}

export async function fetchSales(params?: { customer_id?: number; date?: string; per_page?: number }): Promise<Sale[]> {
  const res = await api.get('/sales', { params });
  const raw = res.data.data || res.data;
  return Array.isArray(raw) ? raw : (raw.data || []);
}

export async function fetchSaleById(id: number): Promise<Sale> {
  const res = await api.get(`/sales/${id}`);
  return res.data.data || res.data;
}

export async function fetchCustomersResponse(params?: { search?: string; has_balance?: boolean }): Promise<{ data: Customer[]; total_outstanding_khaata?: number }> {
  const res = await api.get('/customers', { params });
  const raw = res.data.data || res.data;
  if (Array.isArray(raw)) {
    return { data: raw, total_outstanding_khaata: res.data?.total_outstanding_khaata };
  }
  return {
    data: raw.data || [],
    total_outstanding_khaata: raw.total_outstanding_khaata ?? res.data?.total_outstanding_khaata,
  };
}

export async function fetchCustomers(params?: { search?: string; has_balance?: boolean }): Promise<Customer[]> {
  const response = await fetchCustomersResponse(params);
  return response.data;
}

export async function createCustomer(payload: Partial<Customer>): Promise<Customer> {
  const res = await api.post('/customers', payload);
  return res.data.data || res.data;
}

export async function updateCustomer(id: number, payload: Partial<Customer>): Promise<Customer> {
  const res = await api.put(`/customers/${id}`, payload);
  return res.data.data || res.data;
}

export async function fetchCustomerLedger(customerId: number, params?: { date_filter?: string; start_date?: string; end_date?: string }): Promise<CreditLedger[]> {
  const res = await api.get(`/customers/${customerId}/ledger`, { params });
  const raw = res.data.data || res.data;
  return Array.isArray(raw) ? raw : (raw.data || []);
}

export async function recordPayment(customerId: number, payload: { amount: number; reference_number?: string; notes?: string }): Promise<CreditLedger> {
  const res = await api.post(`/customers/${customerId}/payment`, payload);
  return res.data.data || res.data;
}

// ===================== EXPENSES =====================
export async function fetchExpenses(): Promise<Expense[]> {
  const res = await api.get('/expenses');
  const raw = res.data.data || res.data;
  return Array.isArray(raw) ? raw : (raw.data || []);
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const res = await api.post('/expenses', payload);
  return res.data.data || res.data;
}

// ===================== DAILY CLOSING =====================
export async function fetchDailyClosingPreview(): Promise<DailyClosingPreview> {
  const res = await api.get('/daily-closing/preview');
  return res.data.data || res.data;
}

export async function submitDailyClosing(payload: DailyClosingPayload): Promise<any> {
  const res = await api.post('/daily-closing', payload);
  return res.data.data || res.data;
}

// ===================== DASHBOARD =====================
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get('/dashboard');
  return res.data.data || res.data;
}

// ===================== DEV DB EXPLORER =====================
export async function inspectDevTable(table: string): Promise<any> {
  const res = await api.get(`/dev/db-explorer/${table}`);
  return res.data.data || res.data;
}
