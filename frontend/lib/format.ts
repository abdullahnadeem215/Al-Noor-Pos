export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPKRWithSymbol(amount: number): string {
  return `Rs. ${formatPKR(amount)}`;
}

export function formatGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(2)} kg`;
  }
  return `${grams.toFixed(0)}g`;
}

export function getStockStatus(product: { stock_quantity: number; low_stock_threshold: number; selling_mode: string }): {
  label: string;
  color: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
} {
  if (product.stock_quantity <= 0) {
    return { label: 'Out of Stock', color: 'bg-red-500', status: 'out_of_stock' };
  }
  if (product.stock_quantity <= product.low_stock_threshold) {
    return { label: 'Low Stock', color: 'bg-amber-500', status: 'low_stock' };
  }
  return { label: 'In Stock', color: 'bg-emerald-500', status: 'in_stock' };
}

export function formatStockDisplay(product: { stock_quantity: number; selling_mode: string }): string {
  if (product.selling_mode === 'weight') {
    return formatGrams(product.stock_quantity);
  }
  return `${product.stock_quantity} units`;
}

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
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
