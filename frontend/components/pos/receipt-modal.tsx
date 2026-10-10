'use client';

import { useRef } from 'react';
import { Printer, X, Check, Download } from 'lucide-react';
import { formatPKR, formatGrams, formatDate } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { downloadA4InvoicePDF } from '@/lib/pdf-printer';

interface ReceiptModalProps {
  sale?: any | null;
  payment?: any | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptModal({ sale, payment, open, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale && !payment) return null;

  const isPaymentReceipt = !!payment;
  const titleNumber = isPaymentReceipt
    ? (payment.reference_number || `PAY-${payment.id}`)
    : (sale?.invoice_number || `KH-${sale?.id}`);

  // Native 80mm Thermal Receipt Print
  function handlePrint() {
    window.print();
  }

  // A4 Invoice PDF Export
  function handleDownloadPDF() {
    downloadA4InvoicePDF(sale, payment);
  }

  // Payment Status formatting
  let paymentStatusLabel = 'UNPAID / KHAATA CREDIT';
  if (!isPaymentReceipt && sale) {
    const status = sale.payment_status?.toLowerCase();
    if (status === 'paid') {
      paymentStatusLabel = 'PAID';
    } else if (status === 'partial') {
      paymentStatusLabel = 'PARTIALLY PAID';
    } else {
      paymentStatusLabel = 'UNPAID (ADDED TO KHAATA)';
    }
  }

  // Payment calculations for payment receipts
  const amountReceived = isPaymentReceipt ? (payment.amount || 0) : 0;
  const remainingBalance = isPaymentReceipt ? (payment.balance_after || 0) : 0;
  const previousBalance = isPaymentReceipt ? (remainingBalance + amountReceived) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Khaata Receipt {titleNumber}</DialogTitle>
        </DialogHeader>

        {/* Success Header Banner */}
        <div className="no-print bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">
                {isPaymentReceipt ? 'Payment Receipt' : 'Khaata Invoice'}
              </p>
              <p className="text-xs text-white/80 font-mono">{titleNumber}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Printable Receipt Area */}
        <div
          ref={receiptRef}
          id="receipt-printable-area"
          className="receipt-print-area p-6 font-mono text-xs leading-relaxed bg-white text-black border m-3 rounded-lg"
        >
          {/* Shop Branding */}
          <div className="text-center border-b border-dashed border-black pb-3 mb-3">
            <h2 className="font-black text-base uppercase tracking-wider">AL-NOOR GROCERY</h2>
            <p className="text-[10px] uppercase font-bold text-gray-700">Khaata & Business Management</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Yousafabad, Street #4, Faisalabad</p>
          </div>

          {/* Metadata */}
          <div className="border-b border-dashed border-black pb-3 mb-3 space-y-1">
            <div className="flex justify-between">
              <span>{isPaymentReceipt ? 'Receipt #:' : 'Invoice #:'}</span>
              <span className="font-bold">{titleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(isPaymentReceipt ? payment.created_at : sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold">
                {isPaymentReceipt
                  ? (payment.customer?.name || 'Customer')
                  : (sale.customer?.name || 'Walk-in Customer')}
              </span>
            </div>
          </div>

          {/* Khaata Invoice Items */}
          {!isPaymentReceipt && sale && (
            <>
              <table className="w-full mb-3 text-xs">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left pb-1 uppercase text-[10px]">Item</th>
                    <th className="text-right pb-1 uppercase text-[10px]">Qty/Wt</th>
                    <th className="text-right pb-1 uppercase text-[10px]">Price</th>
                    <th className="text-right pb-1 uppercase text-[10px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-gray-300">
                  {sale.items?.map((item: any, idx: number) => {
                    const isWeight = item.selling_mode === 'weight';
                    const qtyStr = isWeight ? formatGrams(item.weight_grams) : `${item.quantity} ${item.unit_snapshot || 'pc'}`;
                    const price = item.unit_base_price_snapshot || item.unit_price || 0;
                    return (
                      <tr key={idx} className="py-1">
                        <td className="py-1 font-medium">{item.product_name_snapshot || item.name}</td>
                        <td className="py-1 text-right">{qtyStr}</td>
                        <td className="py-1 text-right">Rs.{formatPKR(price)}</td>
                        <td className="py-1 text-right font-bold">Rs.{formatPKR(item.total || item.subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="border-t border-dashed border-black pt-2 space-y-1">
                <div className="flex justify-between text-sm font-bold border-b border-black pb-1">
                  <span>Invoice Total:</span>
                  <span>Rs. {formatPKR(sale.total || sale.subtotal)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Paid Amount:</span>
                  <span>Rs. {formatPKR(sale.paid_amount || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700">
                  <span>Balance Due:</span>
                  <span>Rs. {formatPKR(sale.due_amount || 0)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Payment Status:</span>
                  <span className="uppercase">{paymentStatusLabel}</span>
                </div>
              </div>
            </>
          )}

          {/* Payment Receipt Details */}
          {isPaymentReceipt && payment && (
            <div className="space-y-1.5 py-2">
              <div className="flex justify-between text-xs">
                <span>Previous Balance:</span>
                <span className="font-bold">Rs. {formatPKR(previousBalance)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-t py-1 font-bold">
                <span>Amount Received:</span>
                <span className="text-emerald-700">Rs. {formatPKR(amountReceived)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1">
                <span>Remaining Balance:</span>
                <span className="text-rose-700">Rs. {formatPKR(remainingBalance)}</span>
              </div>
              {payment.notes && (
                <div className="flex justify-between text-[10px] text-gray-600 pt-1">
                  <span>Notes:</span>
                  <span>{payment.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Receipt Footer */}
          <div className="text-center border-t border-dashed border-black pt-3 mt-4 text-[10px]">
            <p className="font-bold uppercase">PERMANENT BUSINESS RECORD</p>
            <p className="text-gray-600 mt-0.5">Thank you for your business!</p>
          </div>
        </div>

        {/* Action Buttons (Hidden during printing) */}
        <div className="no-print p-4 bg-muted/40 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF
          </Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
