export function formatPKR(amount?: any): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPKRWithSymbol(amount?: any): string {
  return `Rs. ${formatPKR(amount)}`;
}

export function formatGrams(grams?: any): string {
  const num = typeof grams === 'number' ? grams : parseFloat(grams);
  if (num === undefined || num === null || isNaN(num)) return '0g';
  if (num >= 1000) {
    const kg = num / 1000;
    return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(2)} kg`;
  }
  return `${num.toFixed(0)}g`;
}

export function getStockStatus(product: { current_stock?: any; stock_quantity?: any; low_stock_threshold?: any; minimum_stock?: any; selling_mode?: string }): {
  label: string;
  color: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
} {
  const rawStock = product.current_stock ?? product.stock_quantity ?? 0;
  const rawMin = product.minimum_stock ?? product.low_stock_threshold ?? 5;
  const stock = typeof rawStock === 'number' ? rawStock : (parseFloat(rawStock) || 0);
  const minStock = typeof rawMin === 'number' ? rawMin : (parseFloat(rawMin) || 5);

  if (stock <= 0) {
    return { label: 'Out of Stock', color: 'bg-red-500', status: 'out_of_stock' };
  }
  if (stock <= minStock) {
    return { label: 'Low Stock', color: 'bg-amber-500', status: 'low_stock' };
  }
  return { label: 'In Stock', color: 'bg-emerald-500', status: 'in_stock' };
}

export function formatStockDisplay(product: { current_stock?: any; stock_quantity?: any; selling_mode?: string }): string {
  const rawStock = product.current_stock ?? product.stock_quantity ?? 0;
  const stock = typeof rawStock === 'number' ? rawStock : (parseFloat(rawStock) || 0);
  const mode = product.selling_mode ?? 'quantity';

  if (mode === 'weight') {
    return formatGrams(stock);
  }
  return `${stock} units`;
}

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent',
  electricity: 'Electricity',
  staff_salary: 'Staff Salary',
  tea_refreshment: 'Tea / Refreshment',
  transport: 'Transport',
  repairs: 'Repairs',
  misc: 'Miscellaneous',
};
