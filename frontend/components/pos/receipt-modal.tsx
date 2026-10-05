'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
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
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const paymentLabel: Record<string, string> = {
    cash: 'CASH',
    credit: 'CREDIT (UDHAAR)',
    online: 'ONLINE TRANSFER',
    split: 'SPLIT PAYMENT',
  };

  function printReceipt() {
    const receipt = receiptRef.current;
    if (!receipt) {
      toast.error('Receipt is not ready to print.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=420,height=700');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the receipt.');
      return;
    }

    const stylesheetLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((link) => `<link rel="stylesheet" href="${link.href}">`)
      .join('');

    printWindow.addEventListener('load', () => {
      printWindow.print();
      printWindow.close();
    }, { once: true });

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt ${sale?.invoice_ref || ''}</title>
          ${stylesheetLinks}
          <style>
            @page { size: 80mm auto; margin: 0; }
            html, body {
              width: 80mm !important;
              min-width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            body {
              color: #000 !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            }
            body * { visibility: hidden !important; }
            .thermal-receipt-container,
            .thermal-receipt-container * { visibility: visible !important; }
            .thermal-receipt-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              display: block !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 2mm !important;
              box-sizing: border-box !important;
              color: #000 !important;
              background: #fff !important;
            }
            .thermal-receipt-container .no-print { display: none !important; }
          </style>
        </head>
        <body>${receipt.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  }

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
            <p className="text-sm text-white/80">Invoice {sale.invoice_ref} recorded</p>
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

        {/* Receipt Content (Printable Thermal 80mm Layout) */}
        <div
          ref={receiptRef}
          id="receipt-print-area"
          className="thermal-receipt-container receipt-paper p-5 font-mono text-[11px] leading-relaxed bg-white text-black"
        >
          {/* Header */}
          <div className="receipt-header mb-3 text-center border-b border-dashed border-black pb-2">
            <h2 className="receipt-brand-name font-bold text-lg uppercase tracking-wider">AL-NOOR STORE</h2>
            <p className="text-[10px] uppercase font-semibold text-gray-700">POS & INVENTORY SYSTEM</p>
            <p className="text-[10px] mt-1">Yousafabad, Street #4</p>
            <p className="text-[10px]">Faisalabad, Pakistan</p>
          </div>

          <div className="receipt-meta my-2 border-b border-dashed border-black pb-2 text-[11px]">
            <div className="flex justify-between gap-2">
              <span>Invoice:</span>
              <span className="text-right font-bold">{sale.invoice_ref}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Date:</span>
              <span className="text-right">{formatDateTime(sale.date)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Cashier:</span>
              <span className="text-right">{sale.cashier_name}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between gap-2">
                <span>Customer:</span>
                <span className="text-right">{sale.customer_name}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="receipt-items mb-2 w-full text-[11px]">
            <colgroup>
              <col className="receipt-item-name" />
              <col className="receipt-item-qty" />
              <col className="receipt-item-rate" />
              <col className="receipt-item-total" />
            </colgroup>
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left pb-1 uppercase">ITEM</th>
                <th className="text-right pb-1 uppercase">QTY/WT</th>
                <th className="text-right pb-1 uppercase">RATE</th>
                <th className="text-right pb-1 uppercase">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dotted border-gray-300">
                  <td className="py-1 text-left font-medium">
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
                  <td className="py-1 text-right font-bold">
                    {formatPKR(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="receipt-summary space-y-1 border-t border-dashed border-black pt-2 text-[11px]">
            <div className="flex justify-between gap-2">
              <span>Subtotal</span>
              <span className="text-right font-semibold">Rs. {formatPKR(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Discount</span>
              <span className="text-right font-semibold">Rs. 0</span>
            </div>
            <div className="flex justify-between gap-2 text-sm font-bold border-t border-b border-black py-1 my-1">
              <span>TOTAL</span>
              <span className="text-right">Rs. {formatPKR(sale.grand_total)}</span>
            </div>
            <div className="flex justify-between gap-2 pt-0.5">
              <span>Payment</span>
              <span className="text-right font-bold">{paymentLabel[sale.payment_method] || sale.payment_method.toUpperCase()}</span>
            </div>
            {sale.payment_method === 'cash' && (
              <>
                <div className="flex justify-between gap-2">
                  <span>Cash Received:</span>
                  <span className="text-right">Rs. {formatPKR(sale.cash_tendered || sale.grand_total)}</span>
                </div>
                <div className="flex justify-between gap-2 font-medium">
                  <span>Change:</span>
                  <span className="text-right">Rs. {formatPKR(sale.change_returned || 0)}</span>
                </div>
              </>
            )}
            {sale.customer_balance !== undefined && sale.customer_balance !== null && (
              <div className="flex justify-between gap-2 pt-1 border-t border-dotted border-gray-300">
                <span>Remaining Khata Balance:</span>
                <span className="text-right font-bold">Rs. {formatPKR(sale.customer_balance)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="receipt-footer text-center mt-3 pt-2 border-t border-dashed border-black">
            <p className="text-[10px] font-bold uppercase">Thank you for shopping!</p>
            <p className="text-[9px] mt-0.5">Please visit again.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print p-4 flex gap-2 border-t bg-muted/30">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={printReceipt}>
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
