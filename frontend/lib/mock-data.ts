import type {
  Category,
  Product,
  Customer,
  LedgerEntry,
  Expense,
  DailyClosingPreview,
  DashboardData,
  DailySummaryReport,
  InventoryMovement,
  SaleResponse,
  TopProduct,
} from './types';

// ===================== CATEGORIES =====================
export const mockCategories: Category[] = [
  { id: 1, name: 'Sugar', description: 'White refined sugar', product_count: 3 },
  { id: 2, name: 'Rice', description: 'All rice varieties', product_count: 4 },
  { id: 3, name: 'Pulses/Daal', description: 'Lentils and pulses', product_count: 6 },
  { id: 4, name: 'Spices', description: 'Ground and whole spices', product_count: 5 },
  { id: 5, name: 'Beverages', description: 'Tea, juices, soft drinks', product_count: 4 },
  { id: 6, name: 'Snacks', description: 'Biscuits, chips, namkeen', product_count: 5 },
  { id: 7, name: 'Toiletries', description: 'Soap, shampoo, cleaning', product_count: 4 },
];

// ===================== PRODUCTS =====================
export const mockProducts: Product[] = [
  { id: 1, name: 'Refined White Sugar', sku: 'SGR-001', barcode: '8901234500011', category_id: 1, selling_mode: 'weight', unit_cost_price: 165, base_selling_price: 180, stock_quantity: 25000, low_stock_threshold: 5000 },
  { id: 2, name: 'Desi Khand (Brown Sugar)', sku: 'SGR-002', barcode: '8901234500028', category_id: 1, selling_mode: 'weight', unit_cost_price: 190, base_selling_price: 210, stock_quantity: 8000, low_stock_threshold: 3000 },
  { id: 3, name: 'Sugar Cubes', sku: 'SGR-003', barcode: '8901234500035', category_id: 1, selling_mode: 'quantity', unit_cost_price: 220, base_selling_price: 250, stock_quantity: 48, low_stock_threshold: 20 },
  { id: 4, name: 'Basmati Rice (Super Kernel)', sku: 'RCE-001', barcode: '8901234500042', category_id: 2, selling_mode: 'weight', unit_cost_price: 320, base_selling_price: 360, stock_quantity: 40000, low_stock_threshold: 10000 },
  { id: 5, name: 'Sella Rice', sku: 'RCE-002', barcode: '8901234500059', category_id: 2, selling_mode: 'weight', unit_cost_price: 260, base_selling_price: 290, stock_quantity: 35000, low_stock_threshold: 8000 },
  { id: 6, name: 'IRRI-6 Rice', sku: 'RCE-003', barcode: '8901234500066', category_id: 2, selling_mode: 'weight', unit_cost_price: 140, base_selling_price: 160, stock_quantity: 3000, low_stock_threshold: 8000 },
  { id: 7, name: 'Broken Rice (Cattle Feed)', sku: 'RCE-004', barcode: '8901234500073', category_id: 2, selling_mode: 'weight', unit_cost_price: 80, base_selling_price: 95, stock_quantity: 15000, low_stock_threshold: 5000 },
  { id: 8, name: 'Masoor Dal (Pink)', sku: 'PUL-001', barcode: '8901234500080', category_id: 3, selling_mode: 'weight', unit_cost_price: 280, base_selling_price: 320, stock_quantity: 12000, low_stock_threshold: 4000 },
  { id: 9, name: 'Moong Dal (Yellow)', sku: 'PUL-002', barcode: '8901234500097', category_id: 3, selling_mode: 'weight', unit_cost_price: 300, base_selling_price: 340, stock_quantity: 10000, low_stock_threshold: 3500 },
  { id: 10, name: 'Chana Dal (Split Chickpea)', sku: 'PUL-003', barcode: '8901234500103', category_id: 3, selling_mode: 'weight', unit_cost_price: 220, base_selling_price: 250, stock_quantity: 14000, low_stock_threshold: 5000 },
  { id: 11, name: 'Maash Dal (Whole Urad)', sku: 'PUL-004', barcode: '8901234500110', category_id: 3, selling_mode: 'weight', unit_cost_price: 340, base_selling_price: 380, stock_quantity: 6000, low_stock_threshold: 3000 },
  { id: 12, name: 'Kabuli Chana (White Chickpea)', sku: 'PUL-005', barcode: '8901234500127', category_id: 3, selling_mode: 'weight', unit_cost_price: 260, base_selling_price: 300, stock_quantity: 9000, low_stock_threshold: 3000 },
  { id: 13, name: 'Rajma (Red Kidney Beans)', sku: 'PUL-006', barcode: '8901234500134', category_id: 3, selling_mode: 'weight', unit_cost_price: 380, base_selling_price: 420, stock_quantity: 2500, low_stock_threshold: 3000 },
  { id: 14, name: 'Red Chili Powder', sku: 'SPC-001', barcode: '8901234500141', category_id: 4, selling_mode: 'weight', unit_cost_price: 600, base_selling_price: 680, stock_quantity: 5000, low_stock_threshold: 2000 },
  { id: 15, name: 'Turmeric Powder (Haldi)', sku: 'SPC-002', barcode: '8901234500158', category_id: 4, selling_mode: 'weight', unit_cost_price: 450, base_selling_price: 520, stock_quantity: 4000, low_stock_threshold: 1500 },
  { id: 16, name: 'Coriander Powder (Dhania)', sku: 'SPC-003', barcode: '8901234500165', category_id: 4, selling_mode: 'weight', unit_cost_price: 300, base_selling_price: 350, stock_quantity: 6000, low_stock_threshold: 2000 },
  { id: 17, name: 'Garam Masala Mix', sku: 'SPC-004', barcode: '8901234500172', category_id: 4, selling_mode: 'weight', unit_cost_price: 800, base_selling_price: 900, stock_quantity: 2000, low_stock_threshold: 1000 },
  { id: 18, name: 'Cumin Seeds (Zeera)', sku: 'SPC-005', barcode: '8901234500189', category_id: 4, selling_mode: 'weight', unit_cost_price: 700, base_selling_price: 800, stock_quantity: 3500, low_stock_threshold: 1500 },
  { id: 19, name: 'Tapal Danedar Tea (950g)', sku: 'BEV-001', barcode: '8901234500196', category_id: 5, selling_mode: 'quantity', unit_cost_price: 1150, base_selling_price: 1250, stock_quantity: 24, low_stock_threshold: 10 },
  { id: 20, name: 'Lipton Yellow Label (475g)', sku: 'BEV-002', barcode: '8901234500202', category_id: 5, selling_mode: 'quantity', unit_cost_price: 650, base_selling_price: 720, stock_quantity: 8, low_stock_threshold: 10 },
  { id: 21, name: 'Coca Cola 1.5L', sku: 'BEV-003', barcode: '8901234500219', category_id: 5, selling_mode: 'quantity', unit_cost_price: 140, base_selling_price: 170, stock_quantity: 60, low_stock_threshold: 24 },
  { id: 22, name: 'Nestle Water 1.5L', sku: 'BEV-004', barcode: '8901234500226', category_id: 5, selling_mode: 'quantity', unit_cost_price: 60, base_selling_price: 80, stock_quantity: 120, low_stock_threshold: 48 },
  { id: 23, name: 'LU Candi Biscuit', sku: 'SNK-001', barcode: '8901234500233', category_id: 6, selling_mode: 'quantity', unit_cost_price: 50, base_selling_price: 60, stock_quantity: 80, low_stock_threshold: 30 },
  { id: 24, name: 'Kurkure Masala Munch', sku: 'SNK-002', barcode: '8901234500240', category_id: 6, selling_mode: 'quantity', unit_cost_price: 20, base_selling_price: 25, stock_quantity: 200, low_stock_threshold: 50 },
  { id: 25, name: 'Lays Salted (Large)', sku: 'SNK-003', barcode: '8901234500257', category_id: 6, selling_mode: 'quantity', unit_cost_price: 90, base_selling_price: 110, stock_quantity: 45, low_stock_threshold: 20 },
  { id: 26, name: 'Nirala Nimco Mix', sku: 'SNK-004', barcode: '8901234500264', category_id: 6, selling_mode: 'weight', unit_cost_price: 450, base_selling_price: 520, stock_quantity: 4000, low_stock_threshold: 1500 },
  { id: 27, name: 'Cocomo Chocolate', sku: 'SNK-005', barcode: '8901234500271', category_id: 6, selling_mode: 'quantity', unit_cost_price: 10, base_selling_price: 15, stock_quantity: 300, low_stock_threshold: 100 },
  { id: 28, name: 'Lifebuoy Soap (Pack of 3)', sku: 'TOL-001', barcode: '8901234500288', category_id: 7, selling_mode: 'quantity', unit_cost_price: 180, base_selling_price: 210, stock_quantity: 40, low_stock_threshold: 15 },
  { id: 29, name: 'Surf Excel (1kg)', sku: 'TOL-002', barcode: '8901234500295', category_id: 7, selling_mode: 'quantity', unit_cost_price: 420, base_selling_price: 470, stock_quantity: 18, low_stock_threshold: 10 },
  { id: 30, name: 'Sunsilk Shampoo (340ml)', sku: 'TOL-003', barcode: '8901234500301', category_id: 7, selling_mode: 'quantity', unit_cost_price: 350, base_selling_price: 390, stock_quantity: 25, low_stock_threshold: 10 },
  { id: 31, name: 'Colgate Toothpaste (200g)', sku: 'TOL-004', barcode: '8901234500318', category_id: 7, selling_mode: 'quantity', unit_cost_price: 180, base_selling_price: 210, stock_quantity: 35, low_stock_threshold: 12 },
];

// ===================== CUSTOMERS =====================
export const mockCustomers: Customer[] = [
  { id: 1, name: 'Rasheed Ahmed Khan', phone: '0301-2345678', address: 'House 12, Block C, Gulshan-e-Iqbal, Karachi', credit_limit: 50000, outstanding_balance: 18500, created_at: '2026-09-01' },
  { id: 2, name: 'Fatima Bibi', phone: '0321-9876543', address: 'Shop 5, Tariq Road, PECHS, Karachi', credit_limit: 30000, outstanding_balance: 7500, created_at: '2026-09-05' },
  { id: 3, name: 'Mohammad Imran', phone: '0333-1234567', address: 'Flat 3B, Falaknaz Plaza, Shah Faisal Colony', credit_limit: 25000, outstanding_balance: 0, created_at: '2026-09-10' },
  { id: 4, name: 'Abdul Qadir Kiryana Store', phone: '0345-5555666', address: 'Shop 22, Empress Market, Saddar, Karachi', credit_limit: 100000, outstanding_balance: 42000, created_at: '2026-08-15' },
  { id: 5, name: 'Zainab Khatoon', phone: '0300-7777888', address: 'House 45, Block A, North Nazimabad, Karachi', credit_limit: 20000, outstanding_balance: 3200, created_at: '2026-09-15' },
  { id: 6, name: 'Haji Iqbal Wholesale', phone: '0312-1111222', address: 'Shop 101, Jodia Bazaar, Karachi', credit_limit: 200000, outstanding_balance: 0, created_at: '2026-07-20' },
];

// ===================== LEDGER ENTRIES =====================
export const mockLedgerEntries: Record<number, LedgerEntry[]> = {
  1: [
    { id: 1, date: '2026-09-20', type: 'sale_debit', invoice_ref: 'INV-20260920-003', amount: 2500, running_balance: 2500, description: 'Sugar 5kg + Rice 3kg' },
    { id: 2, date: '2026-09-22', type: 'sale_debit', invoice_ref: 'INV-20260922-007', amount: 1800, running_balance: 4300, description: 'Daal + Spices' },
    { id: 3, date: '2026-09-25', type: 'payment_credit', invoice_ref: 'RCT-001', amount: -3000, running_balance: 1300, description: 'Cash payment received' },
    { id: 4, date: '2026-09-28', type: 'sale_debit', invoice_ref: 'INV-20260928-012', amount: 4200, running_balance: 5500, description: 'Monthly grocery supply' },
    { id: 5, date: '2026-10-01', type: 'sale_debit', invoice_ref: 'INV-20261001-005', amount: 13000, running_balance: 18500, description: 'Bulk order - 50kg rice + 20kg sugar' },
  ],
  2: [
    { id: 6, date: '2026-09-15', type: 'sale_debit', invoice_ref: 'INV-20260915-002', amount: 12000, running_balance: 12000 },
    { id: 7, date: '2026-09-18', type: 'payment_credit', invoice_ref: 'RCT-002', amount: -4500, running_balance: 7500 },
  ],
  4: [
    { id: 8, date: '2026-09-01', type: 'sale_debit', invoice_ref: 'INV-20260901-001', amount: 65000, running_balance: 65000 },
    { id: 9, date: '2026-09-10', type: 'payment_credit', invoice_ref: 'RCT-003', amount: -23000, running_balance: 42000 },
  ],
  5: [
    { id: 10, date: '2026-09-28', type: 'sale_debit', invoice_ref: 'INV-20260928-009', amount: 3200, running_balance: 3200 },
  ],
};

// ===================== EXPENSES =====================
export const mockExpenses: Expense[] = [
  { id: 1, date: '2026-10-01', category: 'rent', amount: 45000, payment_source: 'bank', description: 'Monthly shop rent - October 2026' },
  { id: 2, date: '2026-10-01', category: 'electricity', amount: 8500, payment_source: 'bank', description: 'K-Electric bill for September' },
  { id: 3, date: '2026-10-02', category: 'staff_salary', amount: 35000, payment_source: 'bank', description: 'Cashier monthly salary' },
  { id: 4, date: '2026-10-02', category: 'tea_refreshment', amount: 350, payment_source: 'register_cash', description: 'Tea for staff - 2 days' },
  { id: 5, date: '2026-10-03', category: 'transport', amount: 1200, payment_source: 'register_cash', description: 'Rickshaw fare for goods pickup' },
  { id: 6, date: '2026-10-03', category: 'repairs', amount: 2500, payment_source: 'register_cash', description: 'Shelf repair in storage area' },
  { id: 7, date: '2026-10-04', category: 'tea_refreshment', amount: 180, payment_source: 'register_cash', description: 'Tea and biscuits' },
  { id: 8, date: '2026-10-04', category: 'misc', amount: 500, payment_source: 'register_cash', description: 'Plastic bags and packaging' },
];

// ===================== INVENTORY MOVEMENTS =====================
export const mockInventoryMovements: Record<number, InventoryMovement[]> = {
  1: [
    { id: 1, product_id: 1, type: 'opening', quantity: 50000, reference: 'OPENING STOCK', notes: 'Initial inventory setup', created_at: '2026-08-01', user: 'Owner' },
    { id: 2, product_id: 1, type: 'sale', quantity: -5000, reference: 'INV-20260920-003', created_at: '2026-09-20', user: 'Cashier' },
    { id: 3, product_id: 1, type: 'purchase', quantity: 20000, reference: 'PO-001', notes: 'Purchase from Shakar Ganj', created_at: '2026-09-25', user: 'Owner' },
    { id: 4, product_id: 1, type: 'sale', quantity: -20000, reference: 'INV-20261001-005', created_at: '2026-10-01', user: 'Cashier' },
  ],
  4: [
    { id: 5, product_id: 4, type: 'opening', quantity: 80000, reference: 'OPENING STOCK', created_at: '2026-08-01', user: 'Owner' },
    { id: 6, product_id: 4, type: 'sale', quantity: -15000, reference: 'INV-20260928-012', created_at: '2026-09-28', user: 'Cashier' },
    { id: 7, product_id: 4, type: 'sale', quantity: -30000, reference: 'INV-20261001-005', created_at: '2026-10-01', user: 'Cashier' },
  ],
};

// ===================== DAILY CLOSING PREVIEW =====================
export const mockDailyClosingPreview: DailyClosingPreview = {
  date: '2026-10-04',
  opening_float: 5000,
  total_cash_sales: 28450,
  customer_debt_payments_cash: 3000,
  cash_expenses: 1880,
  cash_refunds: 0,
  expected_cash: 34570,
  total_sales: 47200,
  total_online_sales: 8750,
  total_credit_sales: 10000,
  transaction_count: 23,
};

// ===================== DASHBOARD =====================
export const mockDashboardData: DashboardData = {
  today_sales: 47200,
  today_transaction_count: 23,
  today_expenses: 680,
  total_outstanding_debt: 71200,
  low_stock_products: mockProducts.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  ),
  top_selling_products: [
    { product_id: 1, name: 'Refined White Sugar', quantity_sold: 35000, revenue: 6300 },
    { product_id: 4, name: 'Basmati Rice (Super Kernel)', quantity_sold: 28000, revenue: 10080 },
    { product_id: 8, name: 'Masoor Dal (Pink)', quantity_sold: 5000, revenue: 1600 },
    { product_id: 21, name: 'Coca Cola 1.5L', quantity_sold: 24, revenue: 4080 },
    { product_id: 19, name: 'Tapal Danedar Tea (950g)', quantity_sold: 5, revenue: 6250 },
    { product_id: 10, name: 'Chana Dal (Split Chickpea)', quantity_sold: 4000, revenue: 1000 },
  ],
};

// ===================== DAILY SUMMARY REPORT =====================
export const mockDailySummaryReport: DailySummaryReport = {
  date: '2026-10-04',
  gross_sales: 47200,
  cogs: 38500,
  expenses: 680,
  net_profit: 8020,
  payment_method_distribution: {
    cash: 28450,
    credit: 10000,
    online: 8750,
  },
  transaction_count: 23,
};

// ===================== MOCK SALE RESPONSE =====================
export function generateMockSaleResponse(
  invoiceRef: string,
  items: { product_id: number; name: string; selling_mode: 'quantity' | 'weight'; quantity: number; unit_price: number; subtotal: number }[],
  paymentMethod: 'cash' | 'credit' | 'online' | 'split',
  grandTotal: number,
  cashierName: string,
  customerName?: string,
  cashTendered?: number,
  changeReturned?: number,
  customerBalance?: number
): SaleResponse {
  return {
    id: Math.floor(Math.random() * 100000) + 1,
    invoice_ref: invoiceRef,
    date: new Date().toISOString(),
    cashier_name: cashierName,
    customer_name: customerName,
    items,
    subtotal: grandTotal,
    grand_total: grandTotal,
    payment_method: paymentMethod,
    cash_tendered: cashTendered,
    change_returned: changeReturned,
    customer_balance: customerBalance,
  };
}
