'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Receipt,
  Plus,
  Loader2,
  Banknote,
  Landmark,
} from 'lucide-react';
import { fetchExpenses, createExpense } from '@/lib/data-service';
import type { Expense, ExpenseCategory, ExpensePayload } from '@/lib/types';
import { formatPKR, formatDate, EXPENSE_CATEGORY_LABELS } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'rent', 'electricity', 'staff_salary', 'tea_refreshment', 'transport', 'repairs', 'misc'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '' as ExpenseCategory | '',
    amount: '',
    payment_source: 'register_cash' as 'register_cash' | 'bank',
    description: '',
  });

  async function loadExpenses() {
    try {
      const exp = await fetchExpenses();
      setExpenses(exp);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.amount || !form.description) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload: ExpensePayload = {
        date: form.date,
        category: form.category as ExpenseCategory,
        amount: parseFloat(form.amount),
        payment_source: form.payment_source,
        description: form.description,
      };
      await createExpense(payload);
      toast.success('Expense recorded successfully');
      setModalOpen(false);
      setForm({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        payment_source: 'register_cash',
        description: '',
      });
      loadExpenses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashExpenses = expenses.filter((e) => e.payment_source === 'register_cash').reduce((s, e) => s + e.amount, 0);
  const bankExpenses = expenses.filter((e) => e.payment_source === 'bank').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track shop operational expenses
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
          <p className="text-xl font-bold tabular-nums">Rs. {formatPKR(totalExpenses)}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Cash (Register)
          </p>
          <p className="text-xl font-bold tabular-nums">Rs. {formatPKR(cashExpenses)}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Landmark className="w-3 h-3" /> Bank
          </p>
          <p className="text-xl font-bold tabular-nums">Rs. {formatPKR(bankExpenses)}</p>
        </div>
      </div>

      {/* Expense Table */}
      <div className="border rounded-lg bg-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-sm">{formatDate(exp.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{exp.description}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {exp.payment_source === 'register_cash' ? (
                        <><Banknote className="w-3 h-3" /> Cash</>
                      ) : (
                        <><Landmark className="w-3 h-3" /> Bank</>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-destructive">
                    - Rs. {formatPKR(exp.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Receipt className="w-12 h-12 mb-3 opacity-40" />
            <p>No expenses recorded yet</p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Expense
            </DialogTitle>
            <DialogDescription>Record a new shop operational expense</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (Rs.)</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Source</Label>
              <Select
                value={form.payment_source}
                onValueChange={(v) => setForm({ ...form, payment_source: v as 'register_cash' | 'bank' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="register_cash">Register Cash</SelectItem>
                  <SelectItem value="bank">Bank / Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What was this expense for?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[60px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Record Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
