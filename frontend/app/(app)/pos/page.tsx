'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Scale,
  Package,
  CreditCard,
  Banknote,
  Wallet,
  SplitSquareHorizontal,
  Loader2,
  CheckCircle2,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchProducts, fetchCategories, fetchCustomers, createSale } from '@/lib/data-service';
import type { Product, Category, Customer, CartItem, PaymentMethod, SaleResponse } from '@/lib/types';
import { formatPKR, formatGrams, formatStockDisplay, getStockStatus, generateIdempotencyKey } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

export default function POSPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [cashTendered, setCashTendered] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receiptSale, setReceiptSale] = useState<SaleResponse | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [prods, cats, custs] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchCustomers(),
        ]);
        setProducts(prods);
        setCategories(cats);
        setCustomers(custs);
      } catch (err) {
        toast.error('Failed to load products. Please check connection.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const params: { q?: string; category_id?: number } = {};
        if (searchQuery) params.q = searchQuery;
        if (selectedCategory) params.category_id = selectedCategory;
        const prods = await fetchProducts(params);
        setProducts(prods);
      } catch {
        // silently fail
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Global hotkey: focus search on '/' or barcode scan
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter products for display
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      );
    }
    return true;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = subtotal;
  const categoryChips = [{ id: 0, name: 'All' }, ...categories];

  const change = paymentMethod === 'cash' && cashTendered
    ? Math.max(0, parseFloat(cashTendered) - grandTotal)
    : 0;

  const addToCart = useCallback((product: Product, quantity: number = 1, grams?: number) => {
    const cartItemId = `${product.id}-${grams || 'qty'}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                quantity: item.quantity + (grams || quantity),
                subtotal: ((item.quantity + (grams || quantity)) / (product.selling_mode === 'weight' ? 1000 : 1)) * product.base_selling_price,
              }
            : item
        );
      }
      const qty = grams || quantity;
      const sub = product.selling_mode === 'weight'
        ? (qty / 1000) * product.base_selling_price
        : qty * product.base_selling_price;
      return [
        ...prev,
        {
          id: cartItemId,
          product_id: product.id,
          name: product.name,
          selling_mode: product.selling_mode,
          quantity: qty,
          unit_price: product.base_selling_price,
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
      toast.success(`${product.name} added to cart`);
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
    setCashTendered('');
    setSelectedCustomerId('walk-in');
    setPaymentMethod('cash');
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add products to checkout.');
      return;
    }
    if (paymentMethod === 'credit' && selectedCustomerId === 'walk-in') {
      toast.error('Please select a Khata customer for credit sales.');
      return;
    }
    if (paymentMethod === 'cash' && (!cashTendered || parseFloat(cashTendered) < grandTotal)) {
      toast.error('Cash tendered is less than the total amount.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const customerId = selectedCustomerId !== 'walk-in' ? parseInt(selectedCustomerId) : null;
      const salePayload = {
        idempotency_key: generateIdempotencyKey(),
        customer_id: customerId,
        items: cart.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          selling_mode: item.selling_mode,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'cash' ? parseFloat(cashTendered) : undefined,
        change_returned: paymentMethod === 'cash' ? change : undefined,
        subtotal,
        grand_total: grandTotal,
        cashier_name: user?.name || 'Cashier',
      };

      const sale = await createSale(salePayload);
      setReceiptSale(sale);
      setReceiptOpen(true);
      clearCart();
      toast.success('Sale completed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  const paymentMethods: { value: PaymentMethod; label: string; icon: any }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'credit', label: 'Credit (Udhaar)', icon: CreditCard },
    { value: 'online', label: 'Online', icon: Wallet },
    { value: 'split', label: 'Split', icon: SplitSquareHorizontal },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: Product Selection Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search by name, SKU, or scan barcode... (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {categoryChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                  selectedCategory === chip.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {chip.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-40" />
                <p>No products found. Try a different search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredProducts.map((product) => {
                  const stock = getStockStatus(product);
                  return (
                    <motion.button
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleProductClick(product)}
                      className={cn(
                        'relative flex flex-col items-start p-3 rounded-lg border bg-card text-left transition-shadow hover:shadow-md',
                        stock.status === 'out_of_stock' && 'opacity-50'
                      )}
                    >
                      {/* Product Icon */}
                      <div className="w-full h-16 mb-2 rounded-md bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                        {product.selling_mode === 'weight' ? (
                          <Scale className="w-7 h-7 text-muted-foreground" />
                        ) : (
                          <Package className="w-7 h-7 text-muted-foreground" />
                        )}
                      </div>

                      {/* Name */}
                      <p className="text-xs font-medium line-clamp-2 leading-tight mb-1 min-h-[2rem]">
                        {product.name}
                      </p>

                      {/* Price */}
                      <p className="text-sm font-bold text-primary">
                        Rs. {formatPKR(product.base_selling_price)}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {product.selling_mode === 'weight' ? '/kg' : '/pc'}
                        </span>
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-1 mt-2 w-full">
                        <div className={cn('w-2 h-2 rounded-full', stock.color)} />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {formatStockDisplay(product)}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 text-[9px] px-1.5 py-0"
                      >
                        {product.selling_mode === 'weight' ? (
                          <><Scale className="w-2.5 h-2.5 mr-0.5" /> Wt</>
                        ) : (
                          <><Package className="w-2.5 h-2.5 mr-0.5" /> Qty</>
                        )}
                      </Badge>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart Panel */}
      <div
        className={cn(
          'w-full md:w-[380px] border-l bg-card flex flex-col overflow-hidden',
          mobileCartOpen ? 'fixed inset-0 z-40' : 'hidden',
          'md:relative md:flex'
        )}
      >
        {/* Cart Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Current Sale</h2>
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-1">{cart.length}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileCartOpen(false)}
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Click products to add</p>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {item.selling_mode === 'weight' ? 'Weight' : 'Qty'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.selling_mode === 'weight'
                              ? `${formatGrams(item.quantity)} @ Rs. ${formatPKR(item.unit_price)}/kg`
                              : `${item.quantity} × Rs. ${formatPKR(item.unit_price)}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.id, item.selling_mode === 'weight' ? -250 : -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium min-w-[60px] text-center tabular-nums">
                          {item.selling_mode === 'weight' ? formatGrams(item.quantity) : item.quantity}
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
                      <p className="font-bold text-sm tabular-nums">
                        Rs. {formatPKR(item.subtotal)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Cart Footer - Customer, Payment, Checkout */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3">
            {/* Customer Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Customer
              </label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Walk-in Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.outstanding_balance > 0 && `(Rs. ${formatPKR(c.outstanding_balance)} due)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
              <div className="grid grid-cols-4 gap-1">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2 rounded-md border text-[10px] font-medium transition-all',
                        paymentMethod === pm.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered (only for cash) */}
            {paymentMethod === 'cash' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cash Tendered</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="h-9 text-sm tabular-nums"
                  />
                  <div className="flex flex-col items-end justify-center min-w-[80px]">
                    <span className="text-[10px] text-muted-foreground">Change</span>
                    <span className="text-sm font-bold text-success tabular-nums">
                      Rs. {formatPKR(change)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[grandTotal, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000].map((amt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] flex-1"
                      onClick={() => setCashTendered(String(amt))}
                    >
                      {i === 0 ? 'Exact' : formatPKR(amt)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="text-sm tabular-nums">Rs. {formatPKR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">Grand Total</span>
              <span className="text-2xl font-bold text-primary tabular-nums">
                Rs. {formatPKR(grandTotal)}
              </span>
            </div>

            {/* Checkout Button */}
            <Button
              size="lg"
              className="w-full h-12 text-base"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Checkout & Complete Sale
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Cart FAB */}
      {cart.length > 0 && (
        <button
          className="md:hidden fixed bottom-4 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
          onClick={() => setMobileCartOpen(true)}
          aria-label={`Open cart with ${cart.length} items`}
        >
          <ShoppingCart className="w-6 h-6" />
          <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground">
            {cart.length}
          </Badge>
        </button>
      )}

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
