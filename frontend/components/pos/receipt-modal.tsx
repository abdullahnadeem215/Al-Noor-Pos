'use client';

import { Printer, X, Check, Store } from 'lucide-react';
import type { SaleResponse } from '@/lib/types';
import { formatPKR, formatGrams, formatDateTime } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReceiptModalProps {
  sale: SaleResponse | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptModal({ sale, open, onClose }: ReceiptModalProps) {
  if (!sale) return null;

  const paymentLabel: Record<string, string> = {
    cash: 'Cash',
    credit: 'Credit (Udhaar)',
    online: 'Online Transfer',
    split: 'Split Payment',
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="print-receipt-dialog max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Sale Receipt</DialogTitle>
        </DialogHeader>

        {/* Success Banner */}
        <div className="no-print bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-lg">Sale Completed!</p>
            <p className="text-sm text-white/80">Invoice {sale.invoice_ref} has been recorded</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Receipt Content (Printable) */}
        <div id="receipt-print-area" className="p-5 font-mono text-xs leading-relaxed">
          {/* Header */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Store className="w-4 h-4" />
              <h2 className="font-bold text-base">Al-Noor Mart</h2>
            </div>
            <p className="text-[10px]">Shop #12, Gulshan-e-Iqbal, Block C</p>
            <p className="text-[10px]">Karachi, Pakistan</p>
            <p className="text-[10px]">Tel: 021-34567890</p>
          </div>

          <div className="border-t border-b border-dashed border-gray-300 py-2 my-2 text-[10px]">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold">{sale.invoice_ref}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDateTime(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{sale.cashier_name}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{sale.customer_name}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-[10px] mb-2">
            <thead>
              <tr className="border-b border-dashed border-gray-300">
                <th className="text-left pb-1">Item</th>
                <th className="text-right pb-1">Qty/Wt</th>
                <th className="text-right pb-1">Rate</th>
                <th className="text-right pb-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dotted border-gray-200">
                  <td className="py-1 text-left">
                    {item.name}
                  </td>
                  <td className="py-1 text-right">
                    {item.selling_mode === 'weight'
                      ? formatGrams(item.quantity)
                      : `${item.quantity} pc`}
                  </td>
                  <td className="py-1 text-right">
                    {item.selling_mode === 'weight'
                      ? `${formatPKR(item.unit_price)}/kg`
                      : formatPKR(item.unit_price)}
                  </td>
                  <td className="py-1 text-right font-medium">
                    {formatPKR(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-[10px]">
            <div className="flex justify-between font-bold text-sm">
              <span>Grand Total</span>
              <span>Rs. {formatPKR(sale.grand_total)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Payment Method</span>
              <span>{paymentLabel[sale.payment_method] || sale.payment_method}</span>
            </div>
            {sale.payment_method === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>Rs. {formatPKR(sale.cash_tendered || 0)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Change Returned:</span>
                  <span>Rs. {formatPKR(sale.change_returned || 0)}</span>
                </div>
              </>
            )}
            {sale.customer_balance !== undefined && sale.customer_balance !== null && (
              <div className="flex justify-between">
                <span>Remaining Khata Balance:</span>
                <span>Rs. {formatPKR(sale.customer_balance)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-300">
            <p className="text-[10px] font-medium">Thank you for shopping at Al-Noor Mart!</p>
            <p className="text-[9px] text-muted-foreground mt-1">Goods once sold are not returnable</p>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print p-4 flex gap-2 border-t bg-muted/30">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
