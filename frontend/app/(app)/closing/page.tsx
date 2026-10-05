'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RefreshCw,
  DollarSign,
  Receipt,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchDailyClosingPreview, submitDailyClosing } from '@/lib/data-service';
import type { DailyClosingPreview } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function DailyClosingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<DailyClosingPreview | null>(null);
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [closed, setClosed] = useState(false);

  async function loadPreview() {
    try {
      setLoading(true);
      const data = await fetchDailyClosingPreview();
      setPreview(data);
    } catch (err: any) {
      toast.error('Failed to load register shift preview');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPreview();
  }, []);

  const actualCashVal = parseFloat(actualCash) || 0;
  const expectedCashVal = preview?.expected_cash || 0;
  const variance = actualCashVal - expectedCashVal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actualCash || actualCashVal < 0) {
      toast.error('Please enter valid counted cash amount');
      return;
    }

    try {
      setSubmitting(true);
      await submitDailyClosing({
        actual_cash: actualCashVal,
        notes: notes.trim() || undefined,
      });
      setClosed(true);
      toast.success('Register shift closed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit daily closing');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Reconciling Cash Register Shift Data...</p>
        </div>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <Card className="text-center p-6 space-y-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Shift Closed & Reconciled</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Shift date: {preview ? formatDate(preview.closing_date) : 'Today'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Register Cash:</span>
              <span className="font-semibold">Rs. {formatPKR(expectedCashVal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actual Counted Cash:</span>
              <span className="font-semibold">Rs. {formatPKR(actualCashVal)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-medium">Cash Variance:</span>
              <span className={`font-bold ${variance === 0 ? 'text-emerald-500' : variance < 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                {variance === 0 ? 'Balanced (Rs. 0)' : `Rs. ${formatPKR(variance)} (${variance < 0 ? 'Shortage' : 'Overage'})`}
              </span>
            </div>
          </div>
          <Button onClick={() => setClosed(false)} variant="outline">
            View Closing Details
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <LockKeyhole className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shift Closing & Register Reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Audit daily cash float, sales, expenses, and log counted cash variance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Expected Cash Calculation Breakdown */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Register Cash Breakdown
            </CardTitle>
            <CardDescription>
              Automated audit from system transaction logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40">
                <span className="text-muted-foreground">Opening Cash Float</span>
                <span className="font-semibold">Rs. {formatPKR(preview?.opening_cash || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <span>(+) Cash Sales</span>
                <span className="font-bold">Rs. {formatPKR(preview?.cash_sales_amount || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400">
                <span>(+) Customer Debt Cash Payments</span>
                <span className="font-bold">Rs. {formatPKR(preview?.total_customer_payments || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
                <span>(-) Cash Expenses</span>
                <span className="font-bold">Rs. {formatPKR(preview?.total_expenses || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                <span>(-) Cash Refunds</span>
                <span className="font-bold">Rs. {formatPKR(preview?.total_refunds || 0)}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Expected Register Cash</p>
                <p className="text-2xl font-bold text-primary tabular-nums mt-0.5">
                  Rs. {formatPKR(expectedCashVal)}
                </p>
              </div>
              <Badge variant="outline" className="font-mono">
                System Target
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Right: Cashier Count & Variance Submission Form */}
        <Card className="h-full">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg">Register Cash Count</CardTitle>
              <CardDescription>Enter actual physical cash counted in drawer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="actual-cash" className="text-sm font-semibold">
                  Actual Counted Cash (PKR) <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                    Rs.
                  </span>
                  <Input
                    id="actual-cash"
                    type="number"
                    step="0.01"
                    placeholder="Enter physical cash count..."
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    required
                    className="pl-12 text-xl font-bold tabular-nums h-12"
                  />
                </div>
              </div>

              {/* Live Variance Calculation Badge */}
              {actualCash !== '' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-lg border flex items-center justify-between ${
                    variance === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : variance < 0
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {variance === 0 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <div>
                      <p className="text-xs font-medium">Cash Variance</p>
                      <p className="text-lg font-bold tabular-nums">
                        {variance === 0
                          ? 'Balanced (Rs. 0)'
                          : `Rs. ${formatPKR(Math.abs(variance))} (${variance < 0 ? 'Shortage' : 'Overage'})`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="closing-notes" className="text-sm">
                  Shift Notes / Reconcile Comments (Optional)
                </Label>
                <Textarea
                  id="closing-notes"
                  placeholder="Notes about shift operation, cash handover, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={submitting || !actualCash}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Closing Register...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="w-4 h-4 mr-2" />
                    Close Register Shift
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
