'use client';

import { useState, useEffect } from 'react';
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
  Calendar,
  FileText,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchDashboardData, fetchDailySummaryReport } from '@/lib/data-service';
import type { DashboardData, DailySummaryReport } from '@/lib/types';
import { formatPKR, formatGrams, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
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
    } catch (err: any) {
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
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading Dashboard & Real Data Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard & Financial Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Real-time business performance overview powered by live database records
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today Sales</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              Rs. {formatPKR(dashboard?.today_sales || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>{dashboard?.today_transactions || 0} completed orders today</span>
            </p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="relative overflow-hidden border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {dashboard?.today_transactions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average order value: Rs. {formatPKR((dashboard?.today_sales || 0) / Math.max(1, dashboard?.today_transactions || 1))}
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today Expenses</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              Rs. {formatPKR(dashboard?.today_expenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Shop operational expenses logged today</p>
          </CardContent>
        </Card>

        {/* Outstanding Khata Balance */}
        <Card className="relative overflow-hidden border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Khata</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              Rs. {formatPKR(dashboard?.outstanding_credit || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total customer receivables</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview & Warnings
          </TabsTrigger>
          <TabsTrigger value="daily-report">
            <FileText className="w-4 h-4 mr-2" />
            Daily Financial Report
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Warnings */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Reorder Warning Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <CardTitle className="text-lg">Low Stock Reorder Alerts</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {dashboard?.low_stock_products?.length || 0} items require attention
                  </Badge>
                </div>
                <CardDescription>
                  Products with inventory at or below their reorder threshold
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.low_stock_products && dashboard.low_stock_products.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.low_stock_products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-200 dark:border-amber-900/50"
                      >
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="font-mono">
                            {p.selling_mode === 'weight'
                              ? formatGrams(p.stock_quantity)
                              : `${p.stock_quantity} units`}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Min Threshold: {p.low_stock_threshold}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    All inventory levels are currently healthy!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-lg">Top Selling Products</CardTitle>
                </div>
                <CardDescription>Best-performing products by sales revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.top_selling_products && dashboard.top_selling_products.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.top_selling_products.map((item, idx) => (
                      <div
                        key={item.product_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-sm">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty Sold:{' '}
                              {item.selling_mode === 'weight'
                                ? formatGrams(item.quantity_sold)
                                : `${item.quantity_sold} units`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-primary">
                            Rs. {formatPKR(item.total_revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No sales recorded for today yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Daily Financial Summary Report */}
        <TabsContent value="daily-report" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Daily Financial Summary Report</CardTitle>
                <CardDescription>
                  Date: {report ? formatDate(report.date) : 'Today'} — Authoritative real-data breakdown
                </CardDescription>
              </div>
              <Badge variant="secondary" className="w-fit text-xs font-mono">
                Real DB Records
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Financial Summary Highlight */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground font-medium">Gross Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Rs. {formatPKR(report?.gross_sales || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground font-medium">Cost of Goods Sold (COGS)</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    Rs. {formatPKR(report?.cost_of_goods_sold || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Net Profit</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Rs. {formatPKR(report?.net_profit || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Formula: Gross Revenue - COGS - Operational Expenses
                  </p>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Method Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <span className="text-xs text-muted-foreground">Cash Collections</span>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      Rs. {formatPKR(report?.payment_methods?.cash || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <span className="text-xs text-muted-foreground">Credit Issued (Udhaar)</span>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      Rs. {formatPKR(report?.payment_methods?.credit || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <span className="text-xs text-muted-foreground">Online Transfers</span>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      Rs. {formatPKR(report?.payment_methods?.online || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category-Wise Breakdown */}
              {report?.category_sales && report.category_sales.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Category Sales Breakdown</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs font-medium text-muted-foreground">
                        <tr>
                          <th className="p-3 text-left">Category Name</th>
                          <th className="p-3 text-right">Revenue (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {report.category_sales.map((cat, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-3 font-medium">{cat.category_name}</td>
                            <td className="p-3 text-right font-bold text-primary">
                              Rs. {formatPKR(cat.total_sales)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
