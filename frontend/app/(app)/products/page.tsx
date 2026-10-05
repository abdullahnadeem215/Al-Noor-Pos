'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Package,
  Scale,
  Pencil,
  History,
  Loader2,
  Tag,
  Layers,
} from 'lucide-react';
import { fetchProducts, fetchCategories, createProduct, updateProduct, createCategory, fetchInventoryMovements } from '@/lib/data-service';
import type { Product, Category, SellingMode, InventoryMovement } from '@/lib/types';
import { formatPKR, formatGrams, formatStockDisplay, getStockStatus, formatDate, EXPENSE_CATEGORY_LABELS } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  async function loadData() {
    try {
      const [prods, cats] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !(p.barcode && p.barcode.includes(q)))
        return false;
    }
    if (filterCategory !== 'all' && p.category_id !== parseInt(filterCategory)) return false;
    if (filterMode !== 'all' && p.selling_mode !== filterMode) return false;
    if (filterStock !== 'all') {
      const status = getStockStatus(p).status;
      if (filterStock !== status) return false;
    }
    return true;
  });

  async function handleViewHistory(product: Product) {
    setHistoryProduct(product);
    setHistoryOpen(true);
    setMovementsLoading(true);
    try {
      const mv = await fetchInventoryMovements(product.id);
      setMovements(mv);
    } catch {
      toast.error('Failed to load inventory history');
    } finally {
      setMovementsLoading(false);
    }
  }

  async function handleSaveProduct(data: Partial<Product>) {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success('Product updated successfully');
      } else {
        await createProduct(data);
        toast.success('Product added successfully');
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    }
  }

  async function handleSaveCategory(name: string, description: string) {
    try {
      await createCategory({ name, description });
      toast.success('Category created');
      setCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    }
  }

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name || 'Unknown';

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage product catalog, stock levels, and categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button onClick={() => { setEditingProduct(null); setProductModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMode} onValueChange={setFilterMode}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Selling Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="quantity">Quantity</SelectItem>
            <SelectItem value="weight">Weight</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg bg-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU / Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const stock = getStockStatus(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{product.sku}</div>
                      <div className="text-[10px]">{product.barcode}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categoryName(product.category_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {product.selling_mode === 'weight' ? (
                          <><Scale className="w-3 h-3 mr-1" /> Weight</>
                        ) : (
                          <><Package className="w-3 h-3 mr-1" /> Qty</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">Rs. {formatPKR(product.unit_cost_price)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      Rs. {formatPKR(product.base_selling_price)}
                      <span className="text-[10px] text-muted-foreground">
                        {product.selling_mode === 'weight' ? '/kg' : '/pc'}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">{formatStockDisplay(product)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-2 h-2 rounded-full', stock.color)} />
                        <span className="text-xs">{stock.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewHistory(product)}
                          title="Inventory History"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditingProduct(product); setProductModalOpen(true); }}
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-40" />
            <p>No products match your filters</p>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      <ProductFormModal
        open={productModalOpen}
        onClose={() => { setProductModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Category Management Modal */}
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categories={categories}
      />

      {/* Inventory History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Inventory Audit History
            </DialogTitle>
            <DialogDescription>
              {historyProduct?.name} — Stock movement log (immutable)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {movementsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No inventory movements recorded
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{formatDate(m.created_at)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs capitalize',
                            m.type === 'sale' && 'border-orange-500/30 text-orange-600',
                            m.type === 'purchase' && 'border-blue-500/30 text-blue-600',
                            m.type === 'opening' && 'border-muted-foreground/30',
                            m.type === 'adjustment' && 'border-amber-500/30 text-amber-600',
                            m.type === 'return' && 'border-emerald-500/30 text-emerald-600'
                          )}
                        >
                          {m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        'text-right tabular-nums font-medium',
                        m.quantity < 0 ? 'text-destructive' : 'text-success'
                      )}>
                        {m.quantity > 0 ? '+' : ''}{historyProduct?.selling_mode === 'weight' ? formatGrams(Math.abs(m.quantity)) : Math.abs(m.quantity)}
                      </TableCell>
                      <TableCell className="text-xs">{m.reference}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.user || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== Product Form Modal =====================
function ProductFormModal({
  open,
  onClose,
  onSave,
  product,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
  product: Product | null;
  categories: Category[];
}) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sellingMode, setSellingMode] = useState<SellingMode>('quantity');
  const [unitCost, setUnitCost] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [lowStock, setLowStock] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name);
        setSku(product.sku);
        setBarcode(product.barcode || '');
        setCategoryId(String(product.category_id));
        setSellingMode(product.selling_mode);
        setUnitCost(String(product.unit_cost_price));
        setSellPrice(String(product.base_selling_price));
        setStockQty(String(product.stock_quantity));
        setLowStock(String(product.low_stock_threshold));
      } else {
        setName('');
        setSku('');
        setBarcode('');
        setCategoryId(categories[0] ? String(categories[0].id) : '');
        setSellingMode('quantity');
        setUnitCost('');
        setSellPrice('');
        setStockQty('');
        setLowStock('10');
      }
    }
  }, [open, product, categories]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !sku || !categoryId || !sellPrice) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    onSave({
      name,
      sku,
      barcode: barcode || undefined,
      category_id: parseInt(categoryId),
      selling_mode: sellingMode,
      unit_cost_price: parseFloat(unitCost) || 0,
      base_selling_price: parseFloat(sellPrice) || 0,
      stock_quantity: parseFloat(stockQty) || 0,
      low_stock_threshold: parseFloat(lowStock) || 10,
    });
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? `Editing: ${product.name}` : 'Fill in the product details below'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Product Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Refined White Sugar" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SGR-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Barcode</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="8901234500011" />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Selling Mode *</Label>
              <Select value={sellingMode} onValueChange={(v) => setSellingMode(v as SellingMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Quantity (Units)</SelectItem>
                  <SelectItem value="weight">Weight (Kg/Grams)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit Cost Price (Rs.)</Label>
              <Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="165" />
            </div>
            <div className="space-y-1.5">
              <Label>Base Selling Price (Rs.) {sellingMode === 'weight' && '/ kg'}</Label>
              <Input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="180" />
            </div>
            <div className="space-y-1.5">
              <Label>
                {sellingMode === 'weight' ? 'Opening Stock (grams)' : 'Opening Stock (units)'}
              </Label>
              <Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="25000" disabled={!!product} />
              {product && <p className="text-[10px] text-muted-foreground">Stock adjusted via sales/purchases</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Low Stock Alert Threshold</Label>
              <Input type="number" value={lowStock} onChange={(e) => setLowStock(e.target.value)} placeholder="5000" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Category Modal =====================
function CategoryModal({
  open,
  onClose,
  onSave,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  categories: Category[];
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      toast.error('Category name is required');
      return;
    }
    onSave(name, description);
    setName('');
    setDescription('');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Manage Categories
          </DialogTitle>
          <DialogDescription>Create and view product categories</DialogDescription>
        </DialogHeader>

        {/* Existing Categories */}
        <div className="space-y-1.5 max-h-[200px] overflow-auto">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
              <div>
                <span className="text-sm font-medium">{c.name}</span>
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
              </div>
              <Badge variant="secondary" className="text-xs">{c.product_count || 0} items</Badge>
            </div>
          ))}
        </div>

        <Separator />
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Category Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dairy Products" />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="min-h-[60px]" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-1" />
              Create Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Separator() {
  return <div className="h-px bg-border w-full" />;
}
