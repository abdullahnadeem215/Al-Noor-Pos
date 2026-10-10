'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Users,
  Package,
  RefreshCw,
  PlusCircle,
  CreditCard,
  BookOpen,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchDashboardSummary } from '@/lib/data-service';
import type { DashboardSummary, Sale, CreditLedger } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const data = await fetchDashboardSummary();
      setDashboard(data);
    } catch {
      toast.error('Failed to load Khaata dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground font-medium">Loading Jexron Khata Dashboard...</p>
        </div>
      </div>
    );
  }

  const todayCreditSales = dashboard?.today_credit_sales || 0;
  const paymentsToday = dashboard?.payments_received_today || 0;
  const totalOutstanding = dashboard?.total_outstanding_khaata || 0;
  const totalCustomers = dashboard?.total_customers || 0;
  const totalProducts = dashboard?.total_products || 0;
  const recentTx = dashboard?.recent_transactions || [];
  const recentPayments = dashboard?.recent_payments || [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">JEXRON KHATA DASHBOARD</h1>
          <p className="text-sm text-muted-foreground">
            Al-Noor Grocery · Business & Customer Khaata Management System
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-fit">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* TOP 5 METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CARD 1: TODAY'S CREDIT SALES */}
        <Card className="relative overflow-hidden border-l-4 border-l-amber-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              TODAY'S CREDIT SALES
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground tabular-nums">
              Rs. {formatPKR(todayCreditSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Udhaar issued today</p>
          </CardContent>
        </Card>

        {/* CARD 2: PAYMENTS RECEIVED TODAY */}
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              PAYMENTS TODAY
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground tabular-nums">
              Rs. {formatPKR(paymentsToday)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Received from customers</p>
          </CardContent>
        </Card>

        {/* CARD 3: TOTAL OUTSTANDING KHAATA */}
        <Card className="relative overflow-hidden border-l-4 border-l-rose-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              OUTSTANDING KHAATA
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              Rs. {formatPKR(totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Total customer balance</p>
          </CardContent>
        </Card>

        {/* CARD 4: TOTAL CUSTOMERS */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              CUSTOMERS
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground tabular-nums">
              {totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Registered accounts</p>
          </CardContent>
        </Card>

        {/* CARD 5: TOTAL PRODUCTS */}
        <Card className="relative overflow-hidden border-l-4 border-l-teal-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              PRODUCTS
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground tabular-nums">
              {totalProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Inventory items</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <Card className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Shortcuts for main business activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-600/20"
              onClick={() => router.push('/pos')}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              NEW KHAATA INVOICE
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
              onClick={() => router.push('/customers?action=payment')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              RECEIVE PAYMENT
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => router.push('/customers')}
            >
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              CUSTOMERS
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => router.push('/products')}
            >
              <Package className="w-4 h-4 mr-2 text-teal-600" />
              PRODUCTS
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => router.push('/customers')}
            >
              <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
              VIEW LEDGER
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RECENT TRANSACTIONS & RECENT PAYMENTS TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Khaata Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Recent Khaata Invoices</CardTitle>
              <CardDescription>Latest finalized credit sales</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/pos')}>
              New Invoice <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTx.length > 0 ? (
              <div className="space-y-3">
                {recentTx.map((tx: Sale) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">{tx.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        Customer: <span className="font-medium text-foreground">{tx.customer?.name || 'Walk-in'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">
                        Rs. {formatPKR(tx.total)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.created_at ? formatDate(tx.created_at) : 'Today'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                No recent Khaata invoices found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customer Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Recent Customer Payments</CardTitle>
              <CardDescription>Latest credit repayments received</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
              All Customers <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((p: CreditLedger) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                        {p.reference_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Customer: <span className="font-medium text-foreground">{p.creator?.name || 'Customer'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        Rs. {formatPKR(p.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Remaining: Rs. {formatPKR(p.balance_after)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                No recent payments recorded
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
