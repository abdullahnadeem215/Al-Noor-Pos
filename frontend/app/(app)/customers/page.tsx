'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { fetchCustomers, fetchCustomerLedger, receivePayment } from '@/lib/data-service';
import type { Customer, LedgerEntry } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/format';
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
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadCustomers() {
    try {
      const cust = await fetchCustomers();
      setCustomers(cust);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function openCustomerDetail(customer: Customer) {
    setSelectedCustomer(customer);
    setSheetOpen(true);
    setLedgerLoading(true);
    try {
      const entries = await fetchCustomerLedger(customer.id);
      setLedger(entries);
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLedgerLoading(false);
    }
  }

  async function handleReceivePayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    setSaving(true);
    try {
      await receivePayment(selectedCustomer!.id, {
        amount,
        method: paymentMethod as 'cash' | 'online',
        notes: paymentNotes,
      });
      toast.success(`Payment of Rs. ${formatPKR(amount)} received from ${selectedCustomer!.name}`);
      setPaymentOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
      loadCustomers();
      if (selectedCustomer) {
        const updated = { ...selectedCustomer, outstanding_balance: selectedCustomer.outstanding_balance - amount };
        setSelectedCustomer(updated);
        const entries = await fetchCustomerLedger(selectedCustomer.id);
        setLedger(entries);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_balance, 0);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Khata</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Credit ledger and outstanding balances
          </p>
        </div>
        <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-2">
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-lg font-bold text-warning tabular-nums">Rs. {formatPKR(totalOutstanding)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      <div className="border rounded-lg bg-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openCustomerDetail(c)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.phone}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.address}</TableCell>
                  <TableCell className="text-right tabular-nums">Rs. {formatPKR(c.credit_limit)}</TableCell>
                  <TableCell className={cn(
                    'text-right tabular-nums font-bold',
                    c.outstanding_balance > 0 ? 'text-warning' : 'text-success'
                  )}>
                    Rs. {formatPKR(c.outstanding_balance)}
                  </TableCell>
                  <TableCell>
                    {c.outstanding_balance > 0 ? (
                      <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
                        Credit Due
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                        Settled
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
            <p>No customers found</p>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCustomer.name}</SheetTitle>
                <SheetDescription>Customer credit ledger and profile</SheetDescription>
              </SheetHeader>

              {/* Profile Details */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {selectedCustomer.phone}
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  {selectedCustomer.address}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Credit Limit</p>
                    <p className="font-bold tabular-nums">Rs. {formatPKR(selectedCustomer.credit_limit)}</p>
                  </div>
                  <div className={cn(
                    'rounded-lg p-3',
                    selectedCustomer.outstanding_balance > 0 ? 'bg-warning/10' : 'bg-success/10'
                  )}>
                    <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                    <p className={cn(
                      'font-bold tabular-nums',
                      selectedCustomer.outstanding_balance > 0 ? 'text-warning' : 'text-success'
                    )}>
                      Rs. {formatPKR(selectedCustomer.outstanding_balance)}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setPaymentOpen(true)}
                  disabled={selectedCustomer.outstanding_balance <= 0}
                >
                  <HandCoins className="w-4 h-4 mr-2" />
                  Receive Payment
                </Button>

                <Separator />

                {/* Ledger Table */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Transaction Ledger</h3>
                  {ledgerLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : ledger.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No transactions recorded
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Date</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Ref</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                            <TableHead className="text-xs text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledger.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-xs">{formatDate(entry.date)}</TableCell>
                              <TableCell>
                                {entry.type === 'sale_debit' ? (
                                  <span className="flex items-center gap-1 text-xs text-destructive">
                                    <ArrowUpRight className="w-3 h-3" /> Sale Debit
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-success">
                                    <ArrowDownLeft className="w-3 h-3" /> Payment
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{entry.invoice_ref}</TableCell>
                              <TableCell className={cn(
                                'text-right tabular-nums text-xs font-medium',
                                entry.amount < 0 ? 'text-success' : 'text-destructive'
                              )}>
                                {entry.amount < 0 ? '-' : ''}Rs. {formatPKR(Math.abs(entry.amount))}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-xs">
                                Rs. {formatPKR(entry.running_balance)}
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

      {/* Receive Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Receive Payment
            </DialogTitle>
            <DialogDescription>
              Record debt payment from {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReceivePayment} className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-3 flex justify-between">
              <span className="text-sm text-muted-foreground">Current Outstanding</span>
              <span className="font-bold text-warning tabular-nums">
                Rs. {formatPKR(selectedCustomer?.outstanding_balance || 0)}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Amount (Rs.)</Label>
              <Input
                type="number"
                placeholder="Enter amount received"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                autoFocus
                className="text-lg font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online Transfer (Bank/EasyPaisa/JazzCash)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Any reference or notes..."
                className="min-h-[60px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <HandCoins className="w-4 h-4 mr-2" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
