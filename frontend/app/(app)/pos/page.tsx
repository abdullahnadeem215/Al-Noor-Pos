'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Search,
  ShoppingCart,
  Trash2,
  User,
  Plus,
  Minus,
  Scale,
  Package,
  Loader2,
  CheckCircle2,
  Coins,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { fetchProducts, fetchCategories, fetchCustomers, createSale } from '@/lib/data-service';
import type { Product, Category, Customer, CartItem, SellingMode, Sale } from '@/lib/types';
import { formatPKR, formatGrams, formatStockDisplay, getStockStatus, generateIdempotencyKey } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WeightCalculatorModal } from '@/components/pos/weight-calculator-modal';
import { ReceiptModal } from '@/components/pos/receipt-modal';
import { cn } from '@/lib/utils';

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selection
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment Options (Full Credit, Partial Cash, Full Cash)
  const [paymentMode, setPaymentMode] = useState<'full_credit' | 'partial' | 'full_cash'>('full_credit');
  const [partialCashAmount, setPartialCashAmount] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Weight calculator modal
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [weightModalOpen, setWeightModalOpen] = useState(false);

  // Receipt modal
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  async function loadData() {
    try {
      const [prodsRes, cats, custs] = await Promise.all([
        fetchProducts({ per_page: 100 }),
        fetchCategories(),
        fetchCustomers(),
      ]);
      setProducts(prodsRes.data || []);
      setCategories(cats || []);
      setCustomers(custs || []);
      if (custs && custs.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(String(custs[0].id));
      }
    } catch {
      toast.error('Failed to load POS data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !(p.barcode && p.barcode.includes(q))) {
        return false;
      }
    }
    if (selectedCategory > 0 && p.category_id !== selectedCategory) {
      return false;
    }
    return true;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = subtotal;
  const categoryChips = [{ id: 0, name: 'All' }, ...categories];

  // Calculate live payment split
  const parsedPartial = parseFloat(partialCashAmount) || 0;
  let paidAmount = 0;
  if (paymentMode === 'full_cash') {
    paidAmount = grandTotal;
  } else if (paymentMode === 'partial') {
    paidAmount = Math.min(grandTotal, Math.max(0, parsedPartial));
  } else {
    paidAmount = 0;
  }
  const addedToKhaata = Math.max(0, grandTotal - paidAmount);

  const addToCart = useCallback((product: Product, quantity: number = 1, grams?: number, customPrice?: number, priceType: 'selling' | 'wholesale' | 'custom' = 'selling') => {
    const cartItemId = `${product.id}-${grams || 'qty'}`;
    const unitPrice: number = customPrice !== undefined ? customPrice : (priceType === 'wholesale' ? (product.wholesale_price ?? product.base_price ?? 0) : (product.base_price ?? 0));
    const unitStr = product.base_unit || product.stock_unit || (product.selling_mode === 'weight' ? 'KG' : 'Piece');

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        const newQty = existing.quantity + (grams || quantity);
        const newSubtotal = product.selling_mode === 'weight'
          ? (newQty / 1000) * existing.unit_price
          : newQty * existing.unit_price;
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: newQty, subtotal: newSubtotal }
            : item
        );
      }
      const qty = grams || quantity;
      const sub = product.selling_mode === 'weight'
        ? (qty / 1000) * unitPrice
        : qty * unitPrice;

      return [
        ...prev,
        {
          id: cartItemId,
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit: unitStr,
          selling_mode: product.selling_mode,
          quantity: qty,
          unit_price: unitPrice,
          price_type: priceType,
          subtotal: sub,
        },
      ];
    });
  }, []);

  function handleProductClick(product: Product) {
    if (product.selling_mode === 'weight') {
      setWeightModalProduct(product);
      setWeightModalOpen(true);
    } else {
      addToCart(product);
      toast.success(`${product.name} added to invoice`);
    }
  }

  function handleWeightConfirm(grams: number, lineSubtotal: number) {
    if (weightModalProduct) {
      addToCart(weightModalProduct, 1, grams);
      toast.success(`${weightModalProduct.name} (${formatGrams(grams)}) added - Rs. ${formatPKR(lineSubtotal)}`);
    }
    setWeightModalOpen(false);
    setWeightModalProduct(null);
  }

  function updateItemPrice(itemId: string, newPrice: number, priceType: 'selling' | 'wholesale' | 'custom' = 'custom') {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const sub = item.selling_mode === 'weight'
          ? (item.quantity / 1000) * newPrice
          : item.quantity * newPrice;
        return { ...item, unit_price: newPrice, price_type: priceType, subtotal: sub };
      })
    );
  }

  function updateCartQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== itemId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const sub = item.selling_mode === 'weight'
            ? (newQty / 1000) * item.unit_price
            : newQty * item.unit_price;
          return { ...item, quantity: newQty, subtotal: sub };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeCartItem(itemId: string) {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }

  function clearCart() {
    setCart([]);
    setPartialCashAmount('');
    setPaymentMode('full_credit');
  }

  async function handleFinalizeKhaata() {
    if (cart.length === 0) {
      toast.error('Invoice is empty. Select products from inventory.');
      return;
    }
    if (!selectedCustomerId || selectedCustomerId === 'walk-in') {
      toast.error('Please select a customer for Khaata sale.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const customerId = parseInt(selectedCustomerId);
      const itemsPayload = cart.map((item) => ({
        product_id: item.product_id,
        sale_mode: item.selling_mode,
        unit_price: item.unit_price,
        quantity: item.selling_mode === 'quantity' ? item.quantity : undefined,
        weight_grams: item.selling_mode === 'weight' ? item.quantity : undefined,
      }));

      const salePayload = {
        idempotency_key: generateIdempotencyKey(),
        customer_id: customerId,
        items: itemsPayload,
        paid_amount: paidAmount,
      };

      const sale = await createSale(salePayload);
      setReceiptSale(sale);
      setReceiptOpen(true);
      clearCart();
      toast.success(`Khaata Invoice ${sale.invoice_number} finalized permanently!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Finalize failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: Product Selection Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search product name, SKU, or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 text-base shadow-sm"
              autoFocus
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {categoryChips.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs font-medium shrink-0"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Package className="w-12 h-12 mb-3 opacity-40" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const stock = getStockStatus(product);
                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className={cn(
                      'relative flex flex-col items-start p-3 rounded-lg border bg-card text-left transition-shadow hover:shadow-md border-border',
                      stock.status === 'out_of_stock' && 'opacity-50'
                    )}
                  >
                    <div className="w-full h-14 mb-2 rounded-md bg-muted/40 flex items-center justify-center">
                      {product.selling_mode === 'weight' ? (
                        <Scale className="w-6 h-6 text-muted-foreground" />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <p className="text-xs font-semibold line-clamp-2 leading-tight mb-1 min-h-[2rem]">
                      {product.name}
                    </p>

                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {formatPKR(product.base_price)}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        /{product.base_unit || (product.selling_mode === 'weight' ? 'kg' : 'pc')}
                      </span>
                    </p>

                    {(product.wholesale_price ?? 0) > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Wholesale: Rs. {formatPKR(product.wholesale_price)}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-2 w-full">
                      <div className={cn('w-2 h-2 rounded-full', stock.color)} />
                      <span className="text-[10px] text-muted-foreground truncate">
                        Stock: {formatStockDisplay(product)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: Khaata Invoice Cart */}
      <div className="w-full md:w-[440px] border-l bg-card flex flex-col overflow-hidden">
        {/* Invoice Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base">New Khaata Invoice</h2>
            {cart.length > 0 && <Badge variant="secondary">{cart.length} items</Badge>}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="p-4 border-b bg-muted/20 space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-primary" /> Select Customer *
          </label>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="h-10 text-sm font-semibold">
              <SelectValue placeholder="Choose Khaata Customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} {(c.current_balance ?? c.outstanding_balance ?? 0) > 0 ? `(Balance: Rs. ${formatPKR(c.current_balance ?? c.outstanding_balance ?? 0)})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cart Items List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Invoice is empty</p>
                <p className="text-xs mt-1">Select products from inventory to add</p>
              </div>
            ) : (
              cart.map((item) => {
                const rawProduct = products.find((p) => p.id === item.product_id);
                return (
                  <div key={item.id} className="bg-muted/30 border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>
                      </div>
                      <button onClick={() => removeCartItem(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price Selection Buttons */}
                    {rawProduct && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-[10px] text-muted-foreground">Price Mode:</span>
                        <Button
                          type="button"
                          variant={item.price_type === 'selling' ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => updateItemPrice(item.id, rawProduct.base_price ?? 0, 'selling')}
                        >
                          Retail Rs.{formatPKR(rawProduct.base_price)}
                        </Button>
                        {(rawProduct.wholesale_price ?? 0) > 0 && (
                          <Button
                            type="button"
                            variant={item.price_type === 'wholesale' ? 'default' : 'outline'}
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => updateItemPrice(item.id, rawProduct.wholesale_price ?? 0, 'wholesale')}
                          >
                            Wholesale Rs.{formatPKR(rawProduct.wholesale_price)}
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.id, item.selling_mode === 'weight' ? -250 : -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-bold min-w-[70px] text-center tabular-nums">
                          {item.selling_mode === 'weight' ? formatGrams(item.quantity) : `${item.quantity} ${item.unit}`}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.id, item.selling_mode === 'weight' ? 250 : 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Rs. {formatPKR(item.unit_price)} / {item.unit}</p>
                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                          Rs. {formatPKR(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer Checkout */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between text-base font-bold">
              <span>Invoice Total</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                Rs. {formatPKR(grandTotal)}
              </span>
            </div>

            {/* Payment Options (Partial / Credit / Cash) */}
            <div className="space-y-2 border-t pt-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-primary" /> Payment Method at Purchase
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  type="button"
                  variant={paymentMode === 'full_credit' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8 px-1"
                  onClick={() => setPaymentMode('full_credit')}
                >
                  Full Credit
                </Button>
                <Button
                  type="button"
                  variant={paymentMode === 'partial' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8 px-1"
                  onClick={() => setPaymentMode('partial')}
                >
                  Partial Cash
                </Button>
                <Button
                  type="button"
                  variant={paymentMode === 'full_cash' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8 px-1"
                  onClick={() => setPaymentMode('full_cash')}
                >
                  Full Cash
                </Button>
              </div>

              {paymentMode === 'partial' && (
                <div className="space-y-1 mt-2 bg-muted/40 p-2.5 rounded-lg border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Cash Paid Now (Rs.):</span>
                    <Input
                      type="number"
                      placeholder="e.g. 1000"
                      value={partialCashAmount}
                      onChange={(e) => setPartialCashAmount(e.target.value)}
                      className="w-32 h-8 text-right font-bold text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Payment Summary Live Breakdown */}
              <div className="bg-muted/30 p-2 rounded text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Paid Now:</span>
                  <span className="font-semibold text-emerald-600">Rs. {formatPKR(paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Added to Khaata Balance:</span>
                  <span className={cn(addedToKhaata > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600')}>
                    Rs. {formatPKR(addedToKhaata)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              onClick={handleFinalizeKhaata}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Invoice...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  FINALIZE KHAATA SALE
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <WeightCalculatorModal
        product={weightModalProduct}
        open={weightModalOpen}
        onClose={() => {
          setWeightModalOpen(false);
          setWeightModalProduct(null);
        }}
        onConfirm={handleWeightConfirm}
      />
      <ReceiptModal
        sale={receiptSale}
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}
