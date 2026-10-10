'use client';

import { useState, useEffect } from 'react';
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
  Printer,
  Download,
} from 'lucide-react';
import { fetchProducts, fetchCategories, createProduct, updateProduct, createCategory, fetchInventoryMovements } from '@/lib/data-service';
import type { Product, Category, SellingMode, InventoryMovement } from '@/lib/types';
import { formatPKR, formatGrams, formatStockDisplay, getStockStatus, formatDate } from '@/lib/format';
import { printHtmlDocument } from '@/lib/pdf-printer';
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
      const [res, cats] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);
      setProducts(res.data || []);
      setCategories(cats || []);
    } catch {
      toast.error('Failed to load products');
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

  function handlePrintPriceList() {
    const rowsHtml = filtered.map((p) => `
      <tr>
        <td style="font-weight: bold;">${p.name}</td>
        <td style="font-family: monospace;">${p.sku}</td>
        <td style="text-transform: uppercase;">${p.base_unit || p.stock_unit || (p.selling_mode === 'weight' ? 'KG' : 'Piece')}</td>
        <td style="text-align: right;">Rs. ${formatPKR(p.purchase_price || 0)}</td>
        <td style="text-align: right; color: #b45309;">Rs. ${formatPKR(p.wholesale_price || 0)}</td>
        <td style="text-align: right; font-weight: bold; color: #059669;">Rs. ${formatPKR(p.base_price || 0)}</td>
        <td style="text-align: right;">${formatStockDisplay(p)}</td>
        <td style="text-transform: capitalize;">${p.status || 'active'}</td>
      </tr>
    `).join('');

    const bodyHtml = `
      <div class="header">
        <h1>AL-NOOR GROCERY</h1>
        <p>Master Product Catalog & Price List</p>
        <p>Generated on ${new Date().toLocaleDateString('en-PK')}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Unit</th>
            <th style="text-align: right;">Purchase</th>
            <th style="text-align: right;">Wholesale</th>
            <th style="text-align: right;">Selling</th>
            <th style="text-align: right;">Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer">
        <p>Permanent Business Record — Al-Noor Grocery Management System</p>
      </div>
    `;

    printHtmlDocument('Product_Price_List', bodyHtml);
  }

  function handleDownloadPriceList() {
    handlePrintPriceList();
  }

  const categoryName = (id?: number) => categories.find((c) => c.id === id)?.name || 'General';

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Database & Price List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master source for product names, SKUs, units, prices, and stock
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintPriceList}>
            <Printer className="w-4 h-4 mr-2" />
            Print Price List
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPriceList}>
            <Download className="w-4 h-4 mr-2" />
            Download Price List
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button size="sm" onClick={() => { setEditingProduct(null); setProductModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Wholesale Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const stock = getStockStatus(product);
                const unitStr = product.base_unit || product.stock_unit || (product.selling_mode === 'weight' ? 'KG' : 'Piece');
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-semibold text-foreground">{product.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categoryName(product.category_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs uppercase">
                        {unitStr}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      Rs. {formatPKR(product.purchase_price || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-amber-700 dark:text-amber-400">
                      Rs. {formatPKR(product.wholesale_price || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {formatPKR(product.base_price || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatStockDisplay(product)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewHistory(product)}
                          title="Stock Movement History"
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
            <p>No products match your search/filters</p>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
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
              Stock Movement History
            </DialogTitle>
            <DialogDescription>
              {historyProduct?.name} — Immutable inventory audit trail
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {movementsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No inventory movements recorded yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Stock After</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{formatDate(m.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {m.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        'text-right tabular-nums font-medium',
                        (m.quantity_or_grams ?? m.quantity ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'
                      )}>
                        {(m.quantity_or_grams ?? m.quantity ?? 0) > 0 ? '+' : ''}{(m.quantity_or_grams ?? m.quantity ?? 0)}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">{m.stock_after}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.notes || '—'}</TableCell>
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
  const [unit, setUnit] = useState('KG');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [minimumStock, setMinimumStock] = useState('5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name);
        setSku(product.sku);
        setBarcode(product.barcode || '');
        setCategoryId(String(product.category_id || ''));
        setSellingMode(product.selling_mode || 'quantity');
        setUnit(product.base_unit || (product.selling_mode === 'weight' ? 'KG' : 'Piece'));
        setPurchasePrice(String(product.purchase_price || '0'));
        setWholesalePrice(String(product.wholesale_price || '0'));
        setBasePrice(String(product.base_price || '0'));
        setStockQty(String(product.current_stock || '0'));
        setMinimumStock(String(product.minimum_stock || '5'));
      } else {
        setName('');
        setSku('PRD-' + Math.random().toString(36).substring(2, 7).toUpperCase());
        setBarcode('');
        setCategoryId(categories[0] ? String(categories[0].id) : '');
        setSellingMode('weight');
        setUnit('KG');
        setPurchasePrice('170');
        setWholesalePrice('180');
        setBasePrice('190');
        setStockQty('100');
        setMinimumStock('5');
      }
    }
  }, [open, product, categories]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !sku || !basePrice) {
      toast.error('Please fill in required product details');
      return;
    }
    setSaving(true);
    const stockNum = parseFloat(stockQty) || 0;
    onSave({
      name,
      sku,
      barcode: barcode || undefined,
      category_id: categoryId ? parseInt(categoryId) : undefined,
      selling_mode: sellingMode,
      base_unit: unit,
      purchase_price: parseFloat(purchasePrice) || 0,
      wholesale_price: parseFloat(wholesalePrice) || 0,
      base_price: parseFloat(basePrice) || 0,
      current_stock: stockNum,
      opening_stock: stockNum,
      opening_stock_kg: sellingMode === 'weight' ? stockNum : undefined,
      minimum_stock: parseFloat(minimumStock) || 0,
      status: 'active',
    });
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? `Editing: ${product.name}` : 'Fill in master product details'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Product Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sugar / Rice / Ghee" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="PRD-SUGAR" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit (e.g. KG, Piece, Box)</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="KG" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
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
              <Label>Selling Mode</Label>
              <Select value={sellingMode} onValueChange={(v) => setSellingMode(v as SellingMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Weight (Kg/Grams)</SelectItem>
                  <SelectItem value="quantity">Quantity (Units)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Price (Rs.)</Label>
              <Input type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="170" />
            </div>
            <div className="space-y-1.5">
              <Label>Wholesale Price (Rs.)</Label>
              <Input type="number" step="0.01" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} placeholder="180" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Selling Price / Default Retail Price (Rs.) *</Label>
              <Input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="190" />
            </div>
            <div className="space-y-1.5">
              <Label>Current Stock</Label>
              <Input type="number" step="0.001" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-1.5">
              <Label>Minimum Stock Alert</Label>
              <Input type="number" step="0.001" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} placeholder="5" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {product ? 'Update Product' : 'Save Product'}
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
            Product Categories
          </DialogTitle>
          <DialogDescription>Create and view categories</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 max-h-[200px] overflow-auto">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
              <span className="text-sm font-medium">{c.name}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>New Category Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grocery" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
