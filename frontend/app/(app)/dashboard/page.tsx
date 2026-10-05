'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Receipt,
  Users,
  AlertTriangle,
  Award,
  RefreshCw,
  FileText,
  BarChart3,
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
  RotateCcw,
  PackagePlus,
  LockKeyhole,
  ArrowRight,
  Scale,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchDashboardData, fetchDailySummaryReport } from '@/lib/data-service';
import type { DashboardData, DailySummaryReport, TopProduct } from '@/lib/types';
import { formatPKR, formatGrams, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [report, setReport] = useState<DailySummaryReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [dashData, reportData] = await Promise.all([
        fetchDashboardData(),
        fetchDailySummaryReport(),
      ]);
      setDashboard(dashData);
      setReport(reportData);
    } catch {
      toast.error('Failed to load dashboard metrics');
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
          <p className="text-sm text-muted-foreground font-medium">Loading AL-NOOR STORE POS Dashboard...</p>
        </div>
      </div>
    );
  }

  // Safe numerical calculations avoiding NaN, null, or undefined
  const todaySales = typeof dashboard?.today_sales === 'number' && !isNaN(dashboard.today_sales) ? dashboard.today_sales : 0;
  const todayBills = typeof dashboard?.today_bills === 'number' && !isNaN(dashboard.today_bills) ? dashboard.today_bills : (typeof dashboard?.today_transaction_count === 'number' ? dashboard.today_transaction_count : 0);
  const cashToday = typeof dashboard?.cash_today === 'number' && !isNaN(dashboard.cash_today) ? dashboard.cash_today : 0;
  const lowStockCount = typeof dashboard?.low_stock_count === 'number' && !isNaN(dashboard.low_stock_count) ? dashboard.low_stock_count : (dashboard?.low_stock_products?.length || 0);
  const averageBillValue = todayBills > 0 ? todaySales / todayBills : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">AL-NOOR STORE POS DASHBOARD</h1>
          <p className="text-sm text-muted-foreground">
            Yousafabad, Street #4, Faisalabad, Pakistan · Kiryana & Retail Management
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-fit">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* TOP 4 DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TODAY'S SALES */}
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              TODAY'S SALES
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              Rs. {formatPKR(todaySales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Net sales today</p>
          </CardContent>
        </Card>

        {/* CARD 2: TODAY'S BILLS */}
        <Card className="relative overflow-hidden border-l-4 border-l-teal-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              TODAY'S BILLS
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {todayBills}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Completed bills today</p>
          </CardContent>
        </Card>

        {/* CARD 3: CASH TODAY */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              CASH TODAY
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tabular-nums">
              Rs. {formatPKR(cashToday)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Cash collected today</p>
          </CardContent>
        </Card>

        {/* CARD 4: LOW STOCK */}
        <Card className="relative overflow-hidden border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              LOW STOCK
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {lowStockCount} items
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <Card className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Direct shortcuts for common store operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Action */}
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-600/20"
              onClick={() => router.push('/pos')}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              + NEW SALE
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => router.push('/pos?mode=parchi')}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-teal-600" />
              PARCHI SALE
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => router.push('/pos?action=return')}
            >
              <RotateCcw className="w-4 h-4 mr-2 text-amber-600" />
              RETURN
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => router.push('/products')}
            >
              <PackagePlus className="w-4 h-4 mr-2 text-blue-600" />
              ADD STOCK
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => router.push('/closing')}
            >
              <LockKeyhole className="w-4 h-4 mr-2 text-purple-600" />
              SHIFT CLOSING
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TODAY'S SALES BREAKDOWN & AVERAGE BILL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Sales Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Today's Sales Breakdown</CardTitle>
            <CardDescription>Payment collections and returns audit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40 font-medium">
              <span>Cash Sales</span>
              <span className="font-bold text-foreground">Rs. {formatPKR(cashToday)}</span>
            </div>
            {(dashboard?.credit_today || 0) > 0 && (
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40 font-medium">
                <span>Credit Sales (Udhaar)</span>
                <span className="font-bold text-foreground">Rs. {formatPKR(dashboard?.credit_today || 0)}</span>
              </div>
            )}
            {(dashboard?.online_today || 0) > 0 && (
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40 font-medium">
                <span>Online Payments</span>
                <span className="font-bold text-foreground">Rs. {formatPKR(dashboard?.online_today || 0)}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-medium">
              <span>Returns</span>
              <span className="font-bold">Rs. {formatPKR(dashboard?.returns_today || 0)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center font-bold text-base">
              <span>Net Sales</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                Rs. {formatPKR(todaySales)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average Bill & Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Bill Metrics & Customer Receivables</CardTitle>
            <CardDescription>Calculated average bill value & Khata balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground font-medium">Average Bill Value</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {todayBills > 0 ? `Rs. ${formatPKR(averageBillValue)}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Formula: Net Today's Sales / Completed Bills ({todayBills})
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
              <div>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Total Customer Khata Debt</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">
                  Rs. {formatPKR(dashboard?.outstanding_credit || 0)}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push('/customers')}>
                View Khata
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOW STOCK & TOP SELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Reorder Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-base font-bold">Low Stock Reorder Alerts</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/products')}>
                Manage Inventory <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboard?.low_stock_products && dashboard.low_stock_products.length > 0 ? (
              <div className="space-y-3">
                {dashboard.low_stock_products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push('/products')}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {p.sku || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Stock: {p.selling_mode === 'weight' ? formatGrams(p.stock_quantity) : `${p.stock_quantity} units`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Minimum: {p.selling_mode === 'weight' ? formatGrams(p.low_stock_threshold) : `${p.low_stock_threshold} units`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                All products are sufficiently stocked
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base font-bold">Top Selling Products</CardTitle>
            </div>
            <CardDescription>Best-performing items today</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.top_selling_products && dashboard.top_selling_products.length > 0 ? (
              <div className="space-y-3">
                {dashboard.top_selling_products.map((item: any, idx: number) => {
                  const qtySold = typeof item.quantity_sold === 'number' && !isNaN(item.quantity_sold) ? item.quantity_sold : 0;
                  const revenue = typeof item.revenue === 'number' && !isNaN(item.revenue) ? item.revenue : 0;
                  const isWeight = item.selling_mode === 'weight';
                  return (
                    <div
                      key={item.product_id || idx}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty Sold: {isWeight ? `${qtySold} kg` : `${qtySold} units`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          Rs. {formatPKR(revenue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                No sales data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
