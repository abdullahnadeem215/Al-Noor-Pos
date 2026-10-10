'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Loader2,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Printer,
  Download,
  Calendar,
  Eye,
  Plus,
} from 'lucide-react';
import { fetchCustomers, fetchCustomersResponse, fetchCustomerLedger, recordPayment, createCustomer } from '@/lib/data-service';
import type { Customer, CreditLedger } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/format';
import { printHtmlDocument } from '@/lib/pdf-printer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
import { ReceiptModal } from '@/components/pos/receipt-modal';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ledger, setLedger] = useState<CreditLedger[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerOpeningBalance, setNewCustomerOpeningBalance] = useState('0');
  const [saving, setSaving] = useState(false);

  const [receiptSale, setReceiptSale] = useState<any | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [globalTotalOutstanding, setGlobalTotalOutstanding] = useState<number | null>(null);

  async function loadCustomers() {
    try {
      const res = await fetchCustomersResponse();
      setCustomers(res.data || []);
      if (res.total_outstanding_khaata !== undefined) {
        setGlobalTotalOutstanding(res.total_outstanding_khaata);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadLedger(customerId: number, filter?: string, sDate?: string, eDate?: string) {
    setLedgerLoading(true);
    try {
      const entries = await fetchCustomerLedger(customerId, {
        date_filter: filter && filter !== 'all' ? filter : undefined,
        start_date: sDate || undefined,
        end_date: eDate || undefined,
      });
      setLedger(entries || []);
    } catch {
      toast.error('Failed to load customer ledger');
    } finally {
      setLedgerLoading(false);
    }
  }

  async function openCustomerDetail(customer: Customer) {
    setSelectedCustomer(customer);
    setSheetOpen(true);
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    loadLedger(customer.id);
  }

  function handleFilterChange(val: string) {
    setDateFilter(val);
    if (selectedCustomer) {
      loadLedger(selectedCustomer.id, val, startDate, endDate);
    }
  }

  function handleApplyCustomDates() {
    if (selectedCustomer) {
      loadLedger(selectedCustomer.id, dateFilter, startDate, endDate);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomerName) {
      toast.error('Customer name is required');
      return;
    }
    setSaving(true);
    try {
      await createCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
        address: newCustomerAddress,
        opening_balance: parseFloat(newCustomerOpeningBalance) || 0,
      });
      toast.success('Customer added successfully');
      setNewCustomerOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setNewCustomerOpeningBalance('0');
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    setSaving(true);
    try {
      const rec = await recordPayment(selectedCustomer!.id, {
        amount,
        notes: paymentNotes,
      });
      toast.success(`Payment of Rs. ${formatPKR(amount)} received`);
      setPaymentOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
      loadCustomers();
      if (selectedCustomer) {
        const curBal = selectedCustomer.current_balance ?? selectedCustomer.outstanding_balance ?? 0;
        const updated = { ...selectedCustomer, current_balance: curBal - amount, outstanding_balance: curBal - amount };
        setSelectedCustomer(updated);
        loadLedger(selectedCustomer.id, dateFilter, startDate, endDate);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  function handlePrintStatement() {
    if (!selectedCustomer) return;
    const rowsHtml = ledger.map((e) => `
      <tr>
        <td>${formatDate(e.created_at)}</td>
        <td style="font-weight: bold;">${e.reference_number}</td>
        <td style="text-transform: capitalize;">${e.transaction_type}</td>
        <td style="text-align: right;">${e.transaction_type === 'debit' ? `Rs. ${formatPKR(e.amount)}` : '—'}</td>
        <td style="text-align: right;">${e.transaction_type === 'credit' ? `Rs. ${formatPKR(e.amount)}` : '—'}</td>
        <td style="text-align: right; font-weight: bold;">Rs. ${formatPKR(e.balance_after)}</td>
        <td>${e.notes || '—'}</td>
      </tr>
    `).join('');

    const bodyHtml = `
      <div class="header">
        <h1>AL-NOOR GROCERY</h1>
        <p>Customer Khaata Statement — ${selectedCustomer.name}</p>
        <p>Phone: ${selectedCustomer.phone || 'N/A'} | Outstanding Balance: Rs. ${formatPKR(selectedCustomer.current_balance)}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Ref #</th>
            <th>Type</th>
            <th style="text-align: right;">Debit</th>
            <th style="text-align: right;">Credit</th>
            <th style="text-align: right;">Balance</th>
            <th>Notes</th>
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

    printHtmlDocument(`Khaata_Statement_${selectedCustomer.name}`, bodyHtml);
  }

  function handleDownloadStatement() {
    handlePrintStatement();
  }

  function handleViewReceipt(entry: CreditLedger) {
    if (entry.sale) {
      setReceiptSale(entry.sale);
      setReceiptPayment(null);
    } else {
      setReceiptPayment(entry);
      setReceiptSale(null);
    }
    setReceiptOpen(true);
  }

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  const sumCurrentPage = customers.reduce((sum, c) => {
    const bal = c.current_balance ?? c.outstanding_balance ?? 0;
    return sum + (bal > 0 ? bal : 0);
  }, 0);
  const totalOutstanding = globalTotalOutstanding !== null ? globalTotalOutstanding : sumCurrentPage;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Khaata & Ledgers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete transaction history and credit repayment records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Outstanding Khaata</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">Rs. {formatPKR(totalOutstanding)}</p>
          </div>
          <Button onClick={() => setNewCustomerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Customer List Table */}
      <div className="border rounded-lg bg-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openCustomerDetail(c)}>
                  <TableCell className="font-bold text-foreground">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.address || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">Rs. {formatPKR(c.opening_balance || 0)}</TableCell>
                  <TableCell className={cn(
                    'text-right tabular-nums font-black text-sm',
                    (c.current_balance ?? c.outstanding_balance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                  )}>
                    Rs. {formatPKR(c.current_balance ?? c.outstanding_balance ?? 0)}
                  </TableCell>
                  <TableCell>
                    {(c.current_balance ?? c.outstanding_balance ?? 0) > 0 ? (
                      <Badge variant="outline" className="text-rose-600 border-rose-500/30 bg-rose-500/10 text-xs">
                        Credit Due
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-xs">
                        Clear
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openCustomerDetail(c); }}>
                      View Ledger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p>No customers found matching search</p>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer & Ledger */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl font-bold">{selectedCustomer.name}</SheetTitle>
                <SheetDescription>Customer profile & complete Khaata transaction timeline</SheetDescription>
              </SheetHeader>

              {/* Customer Profile Banner */}
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {selectedCustomer.phone}
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {selectedCustomer.address}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Opening Balance</p>
                    <p className="font-bold tabular-nums">Rs. {formatPKR(selectedCustomer.opening_balance || 0)}</p>
                  </div>
                  <div className={cn(
                    'rounded-lg p-3 border',
                    (selectedCustomer.current_balance ?? selectedCustomer.outstanding_balance ?? 0) > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                  )}>
                    <p className="text-xs text-muted-foreground">Current Outstanding Balance</p>
                    <p className={cn(
                      'text-lg font-black tabular-nums',
                      (selectedCustomer.current_balance ?? selectedCustomer.outstanding_balance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                    )}>
                      Rs. {formatPKR(selectedCustomer.current_balance ?? selectedCustomer.outstanding_balance ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Actions & Statements */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() => setPaymentOpen(true)}
                  >
                    <HandCoins className="w-4 h-4 mr-2" />
                    Receive Payment
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintStatement}>
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print Statement
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadStatement}>
                    <Download className="w-4 h-4 mr-1.5" />
                    Download Statement
                  </Button>
                </div>

                <Separator />

                {/* Date Filter Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" /> Date Filter
                    </h3>
                    <Select value={dateFilter} onValueChange={handleFilterChange}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" className="h-8 text-xs" onClick={handleApplyCustomDates}>
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                {/* Ledger Timeline Table */}
                <div>
                  <h3 className="text-sm font-bold mb-2">Ledger Transaction Timeline</h3>
                  {ledgerLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : ledger.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No ledger transactions found
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Date</TableHead>
                            <TableHead className="text-xs">Transaction #</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs text-right">Debit (Sales)</TableHead>
                            <TableHead className="text-xs text-right">Credit (Payment)</TableHead>
                            <TableHead className="text-xs text-right">Balance</TableHead>
                            <TableHead className="text-xs text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledger.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-[11px] whitespace-nowrap">{formatDate(entry.created_at)}</TableCell>
                              <TableCell className="text-xs font-mono font-bold">{entry.reference_number}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(
                                  'text-[10px] capitalize',
                                  entry.transaction_type === 'debit' && 'text-rose-600 border-rose-500/30',
                                  entry.transaction_type === 'credit' && 'text-emerald-600 border-emerald-500/30'
                                )}>
                                  {entry.transaction_type === 'debit' ? 'Credit Sale' : 'Payment'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-xs font-bold text-rose-600">
                                {entry.transaction_type === 'debit' ? `Rs. ${formatPKR(entry.amount)}` : '—'}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-xs font-bold text-emerald-600">
                                {entry.transaction_type === 'credit' ? `Rs. ${formatPKR(entry.amount)}` : '—'}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-xs font-bold">
                                Rs. {formatPKR(entry.balance_after)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleViewReceipt(entry)}
                                    title="View Receipt"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add New Customer Modal */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Khaata Customer</DialogTitle>
            <DialogDescription>Create a new customer account in system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="e.g. Muhammad Ali" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="0300-1234567" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} placeholder="House / Street address..." />
            </div>
            <div className="space-y-1.5">
              <Label>Opening Balance (Rs.)</Label>
              <Input type="number" step="0.01" value={newCustomerOpeningBalance} onChange={(e) => setNewCustomerOpeningBalance(e.target.value)} placeholder="0" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewCustomerOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>Save Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receive Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Receive Customer Payment
            </DialogTitle>
            <DialogDescription>
              Record repayment for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Current Balance</span>
              <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">
                Rs. {formatPKR(selectedCustomer?.current_balance || 0)}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label>Amount Received (Rs.) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                autoFocus
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Payment reference..."
                className="min-h-[60px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer Modal */}
      <ReceiptModal
        sale={receiptSale}
        payment={receiptPayment}
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}
