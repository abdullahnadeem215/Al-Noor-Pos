import api from './api';
import { toast } from 'sonner';
import type {
  AuthResponse,
  Category,
  Product,
  Customer,
  LedgerEntry,
  Expense,
  ExpensePayload,
  DailyClosingPreview,
  DailyClosingPayload,
  DashboardData,
  DailySummaryReport,
  InventoryMovement,
  SaleResponse,
  SalePayload,
  PaymentPayload,
} from './types';
import {
  mockCategories,
  mockProducts,
  mockCustomers,
  mockLedgerEntries,
  mockExpenses,
  mockDailyClosingPreview,
  mockDashboardData,
  mockDailySummaryReport,
  mockInventoryMovements,
  generateMockSaleResponse,
} from './mock-data';

// Helper to simulate network delay for mock responses
function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// Check if we should use mock data (backend not reachable)
let useMockData = false;

function isMockMode(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('alnoor_mock_mode') === 'true' || useMockData;
  }
  return false;
}

export function setMockMode(value: boolean) {
  useMockData = value;
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem('alnoor_mock_mode', 'true');
    } else {
      localStorage.removeItem('alnoor_mock_mode');
    }
  }
}

export function getMockMode(): boolean {
  return isMockMode();
}

// ===================== AUTH =====================
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await api.post('/auth/login', { email, password });
    setMockMode(false);
    return res.data;
  } catch (err: any) {
    // Fallback: accept known demo credentials with mock token
    const demoUsers: Record<string, { password: string; user: any }> = {
      'owner@alnoormart.com': {
        password: 'password',
        user: { id: 1, name: 'Imran Al-Noor', email: 'owner@alnoormart.com', role: 'owner' },
      },
      'cashier@alnoormart.com': {
        password: 'password',
        user: { id: 2, name: 'Bilal Ahmed', email: 'cashier@alnoormart.com', role: 'cashier' },
      },
    };

    const demoUser = demoUsers[email];
    if (demoUser && (password === demoUser.password || password === '12345678')) {
      setMockMode(true);
      const mockToken = 'mock-token-' + btoa(email).replace(/=/g, '');
      return delay({
        token: mockToken,
        user: demoUser.user,
      });
    }

    // If it's a network error and no demo match, show specific message
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      throw new Error(
        'Cannot connect to server. Use owner@alnoormart.com or cashier@alnoormart.com with password "password" for demo mode.'
      );
    }

    throw new Error(err.response?.data?.message || 'Invalid credentials');
  }
}

// ===================== PRODUCTS =====================
export async function fetchProducts(params?: {
  q?: string;
  category_id?: number;
}): Promise<Product[]> {
  if (isMockMode()) {
    let filtered = [...mockProducts];
    if (params?.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      );
    }
    if (params?.category_id) {
      filtered = filtered.filter((p) => p.category_id === params.category_id);
    }
    return delay(filtered);
  }
  const res = await api.get('/products', { params });
  return res.data.data || res.data;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  if (isMockMode()) {
    const newProduct: Product = {
      id: Math.max(...mockProducts.map((p) => p.id)) + 1,
      name: payload.name || '',
      sku: payload.sku || '',
      barcode: payload.barcode || '',
      category_id: payload.category_id || 1,
      selling_mode: payload.selling_mode || 'quantity',
      unit_cost_price: payload.unit_cost_price || 0,
      base_selling_price: payload.base_selling_price || 0,
      stock_quantity: payload.stock_quantity || 0,
      low_stock_threshold: payload.low_stock_threshold || 10,
    };
    mockProducts.push(newProduct);
    return delay(newProduct);
  }
  const res = await api.post('/products', payload);
  return res.data.data || res.data;
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<Product> {
  if (isMockMode()) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx >= 0) {
      mockProducts[idx] = { ...mockProducts[idx], ...payload };
      return delay(mockProducts[idx]);
    }
    throw new Error('Product not found');
  }
  const res = await api.put(`/products/${id}`, payload);
  return res.data.data || res.data;
}

// ===================== CATEGORIES =====================
export async function fetchCategories(): Promise<Category[]> {
  if (isMockMode()) {
    return delay(mockCategories);
  }
  const res = await api.get('/categories');
  return res.data.data || res.data;
}

export async function createCategory(payload: { name: string; description?: string }): Promise<Category> {
  if (isMockMode()) {
    const newCat: Category = {
      id: Math.max(...mockCategories.map((c) => c.id)) + 1,
      name: payload.name,
      description: payload.description,
      product_count: 0,
    };
    mockCategories.push(newCat);
    return delay(newCat);
  }
  const res = await api.post('/categories', payload);
  return res.data.data || res.data;
}

// ===================== INVENTORY MOVEMENTS =====================
export async function fetchInventoryMovements(productId: number): Promise<InventoryMovement[]> {
  if (isMockMode()) {
    return delay(mockInventoryMovements[productId] || []);
  }
  const res = await api.get(`/products/${productId}/inventory-movements`);
  return res.data.data || res.data;
}

// ===================== SALES =====================
export async function calculateSale(payload: any): Promise<any> {
  if (isMockMode()) {
    return delay(payload);
  }
  const res = await api.post('/sales/calculate', payload);
  return res.data;
}

export async function createSale(payload: SalePayload): Promise<SaleResponse> {
  if (isMockMode()) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    const invoiceRef = `INV-${dateStr}-${seq}`;
    const customerName = payload.customer_id
      ? mockCustomers.find((c) => c.id === payload.customer_id)?.name
      : undefined;
    return delay(
      generateMockSaleResponse(
        invoiceRef,
        payload.items,
        payload.payment_method,
        payload.grand_total,
        payload.cashier_name,
        customerName,
        payload.cash_tendered,
        payload.change_returned,
        payload.customer_id
          ? mockCustomers.find((c) => c.id === payload.customer_id)?.outstanding_balance
          : undefined
      )
    );
  }
  const res = await api.post('/sales', payload);
  return res.data.data || res.data;
}

// ===================== CUSTOMERS =====================
export async function fetchCustomers(): Promise<Customer[]> {
  if (isMockMode()) {
    return delay(mockCustomers);
  }
  const res = await api.get('/customers');
  return res.data.data || res.data;
}

export async function fetchCustomerLedger(customerId: number): Promise<LedgerEntry[]> {
  if (isMockMode()) {
    return delay(mockLedgerEntries[customerId] || []);
  }
  const res = await api.get(`/customers/${customerId}/ledger`);
  return res.data.data || res.data;
}

export async function receivePayment(customerId: number, payload: PaymentPayload): Promise<any> {
  if (isMockMode()) {
    const customer = mockCustomers.find((c) => c.id === customerId);
    if (customer) {
      customer.outstanding_balance -= payload.amount;
    }
    const ledger = mockLedgerEntries[customerId] || [];
    const newEntry: LedgerEntry = {
      id: Math.max(0, ...ledger.map((e) => e.id)) + 1,
      date: new Date().toISOString().split('T')[0],
      type: 'payment_credit',
      invoice_ref: `RCT-${String(Math.max(0, ...ledger.map((e) => e.id)) + 1).padStart(3, '0')}`,
      amount: -payload.amount,
      running_balance: (customer?.outstanding_balance || 0),
      description: payload.notes || `Payment received via ${payload.method}`,
    };
    ledger.push(newEntry);
    mockLedgerEntries[customerId] = ledger;
    return delay(newEntry);
  }
  const res = await api.post(`/customers/${customerId}/payments`, payload);
  return res.data.data || res.data;
}

// ===================== EXPENSES =====================
export async function fetchExpenses(): Promise<Expense[]> {
  if (isMockMode()) {
    return delay(mockExpenses);
  }
  const res = await api.get('/expenses');
  return res.data.data || res.data;
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  if (isMockMode()) {
    const newExpense: Expense = {
      id: Math.max(...mockExpenses.map((e) => e.id)) + 1,
      ...payload,
      created_at: new Date().toISOString(),
    };
    mockExpenses.push(newExpense);
    return delay(newExpense);
  }
  const res = await api.post('/expenses', payload);
  return res.data.data || res.data;
}

// ===================== DAILY CLOSING =====================
export async function fetchDailyClosingPreview(): Promise<DailyClosingPreview> {
  if (isMockMode()) {
    return delay(mockDailyClosingPreview);
  }
  const res = await api.get('/daily-closing/preview');
  return res.data.data || res.data;
}

export async function submitDailyClosing(payload: DailyClosingPayload): Promise<any> {
  if (isMockMode()) {
    return delay({ success: true, ...payload });
  }
  const res = await api.post('/daily-closing', payload);
  return res.data.data || res.data;
}

// ===================== DASHBOARD =====================
export async function fetchDashboardData(): Promise<DashboardData> {
  if (isMockMode()) {
    return delay(mockDashboardData);
  }
  const res = await api.get('/dashboard');
  return res.data.data || res.data;
}

// ===================== REPORTS =====================
export async function fetchDailySummaryReport(date?: string): Promise<DailySummaryReport> {
  if (isMockMode()) {
    return delay(mockDailySummaryReport);
  }
  const res = await api.get('/reports/daily-summary', { params: { date } });
  return res.data.data || res.data;
}
