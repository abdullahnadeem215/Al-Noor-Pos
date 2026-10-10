/**
 * Universal PDF & Print Helper for Jexron Khata
 * Provides A4 Business Invoice PDF Export and 80mm Thermal Receipt Printing
 */
import { formatPKR, formatGrams, formatDate } from '@/lib/format';

export function downloadA4InvoicePDF(sale: any, payment?: any) {
  const isPaymentReceipt = !!payment;
  const invoiceNumber = isPaymentReceipt
    ? (payment.reference_number || `PAY-${payment.id}`)
    : (sale?.invoice_number || `KH-${sale?.id}`);

  const title = isPaymentReceipt
    ? `A4_Payment_Receipt_${invoiceNumber}`
    : `A4_Khaata_Invoice_${invoiceNumber}`;

  const customerName = isPaymentReceipt
    ? (payment.customer?.name || 'Valued Customer')
    : (sale?.customer?.name || 'Walk-in Customer');

  const customerPhone = isPaymentReceipt
    ? (payment.customer?.phone || 'N/A')
    : (sale?.customer?.phone || 'N/A');

  const customerAddress = isPaymentReceipt
    ? (payment.customer?.address || 'N/A')
    : (sale?.customer?.address || 'N/A');

  const dateStr = formatDate(isPaymentReceipt ? payment.created_at : sale.created_at);

  let itemsRowsHtml = '';
  if (!isPaymentReceipt && sale?.items) {
    itemsRowsHtml = sale.items.map((item: any, idx: number) => {
      const isWeight = item.selling_mode === 'weight';
      const qtyStr = isWeight ? formatGrams(item.weight_grams) : `${item.quantity} ${item.unit_snapshot || 'pc'}`;
      const price = item.unit_base_price_snapshot || item.unit_price || 0;
      const total = item.total || item.subtotal || 0;
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: 600;">${item.product_name_snapshot || item.name}</td>
          <td style="font-family: monospace; font-size: 11px;">${item.sku_snapshot || item.sku || '—'}</td>
          <td style="text-align: center; text-transform: uppercase;">${item.unit_snapshot || 'Unit'}</td>
          <td style="text-align: right; font-weight: 600;">${qtyStr}</td>
          <td style="text-align: right;">Rs. ${formatPKR(price)}</td>
          <td style="text-align: right; font-weight: bold; color: #047857;">Rs. ${formatPKR(total)}</td>
        </tr>
      `;
    }).join('');
  }

  const statusLabel = isPaymentReceipt
    ? 'COMPLETED'
    : (sale?.payment_status === 'paid' ? 'PAID' : (sale?.payment_status === 'partial' ? 'PARTIALLY PAID' : 'UNPAID / KHAATA CREDIT'));

  const amountReceived = isPaymentReceipt ? (payment.amount || 0) : 0;
  const remainingBalance = isPaymentReceipt ? (payment.balance_after || 0) : 0;
  const previousBalance = isPaymentReceipt ? (remainingBalance + amountReceived) : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 15px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header-table {
            width: 100%;
            border-bottom: 3px solid #059669;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 900;
            color: #047857;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            color: #4b5563;
            font-weight: 600;
            margin: 2px 0 0 0;
          }
          .invoice-number {
            font-size: 18px;
            font-weight: 900;
            color: #111827;
            text-align: right;
            margin: 0;
            font-family: monospace;
          }
          .status-tag {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
            margin-top: 4px;
          }
          .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .info-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px 14px;
            vertical-align: top;
            width: 50%;
          }
          .info-box h3 {
            margin: 0 0 6px 0;
            font-size: 11px;
            font-weight: 800;
            color: #047857;
            text-transform: uppercase;
          }
          .info-box p {
            margin: 2px 0;
            font-size: 11px;
            color: #374151;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table.items-table th {
            background: #047857;
            color: #ffffff;
            padding: 8px 10px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            border: 1px solid #047857;
          }
          table.items-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            border-left: 1px solid #f3f4f6;
            border-right: 1px solid #f3f4f6;
            font-size: 11px;
          }
          table.items-table tr:nth-child(even) td {
            background: #f9fafb;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 24px;
          }
          .totals-table td {
            padding: 7px 12px;
            font-size: 11px;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals-table tr.grand-total td {
            background: #047857;
            color: #ffffff;
            font-size: 14px;
            font-weight: 900;
            border-bottom: none;
          }
          .signature-table {
            width: 100%;
            margin-top: 40px;
            padding-top: 20px;
          }
          .signature-line {
            width: 180px;
            border-top: 1px solid #9ca3af;
            text-align: center;
            font-size: 10px;
            color: #4b5563;
            padding-top: 4px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px dashed #d1d5db;
            padding-top: 10px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <h1 class="brand-title">AL-NOOR GROCERY</h1>
              <p class="brand-sub">Khaata & Business Management System</p>
              <p class="brand-sub">Yousafabad, Street #4, Faisalabad</p>
            </td>
            <td style="text-align: right;">
              <h2 class="invoice-number">${isPaymentReceipt ? 'PAYMENT RECEIPT' : 'KHAATA INVOICE'}</h2>
              <p style="margin: 2px 0; font-family: monospace; font-size: 13px; font-weight: bold;">${invoiceNumber}</p>
              <p style="margin: 2px 0; font-size: 11px; color: #4b5563;">Date: ${dateStr}</p>
              <div className="status-tag">${statusLabel}</div>
            </td>
          </tr>
        </table>

        <table class="info-grid">
          <tr>
            <td class="info-box">
              <h3>Billed To Customer</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Phone:</strong> ${customerPhone}</p>
              <p><strong>Address:</strong> ${customerAddress}</p>
            </td>
            <td style="width: 20px;"></td>
            <td class="info-box">
              <h3>Store Information</h3>
              <p><strong>Store Name:</strong> Al-Noor Grocery Mart</p>
              <p><strong>Location:</strong> Yousafabad, Street #4, Faisalabad</p>
              <p><strong>Document Type:</strong> ${isPaymentReceipt ? 'Official Payment Receipt' : 'Permanent Khaata Sale Invoice'}</p>
            </td>
          </tr>
        </table>

        ${!isPaymentReceipt ? `
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Item Description</th>
                <th style="width: 100px;">SKU</th>
                <th style="width: 60px; text-align: center;">Unit</th>
                <th style="width: 90px; text-align: right;">Qty / Wt</th>
                <th style="width: 100px; text-align: right;">Unit Price</th>
                <th style="width: 110px; text-align: right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Invoice Subtotal:</td>
              <td style="text-align: right; font-weight: bold;">Rs. ${formatPKR(sale?.subtotal || sale?.total)}</td>
            </tr>
            <tr>
              <td>Amount Paid Now:</td>
              <td style="text-align: right; color: #047857; font-weight: bold;">Rs. ${formatPKR(sale?.paid_amount || 0)}</td>
            </tr>
            <tr>
              <td>Balance Added to Khaata:</td>
              <td style="text-align: right; color: #b91c1c; font-weight: bold;">Rs. ${formatPKR(sale?.due_amount || 0)}</td>
            </tr>
            <tr class="grand-total">
              <td>Total Amount:</td>
              <td style="text-align: right;">Rs. ${formatPKR(sale?.total || sale?.subtotal)}</td>
            </tr>
          </table>
        ` : `
          <table class="totals-table" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td style="padding: 10px; font-size: 13px;">Previous Account Balance:</td>
              <td style="text-align: right; padding: 10px; font-size: 13px; font-weight: bold;">Rs. ${formatPKR(previousBalance)}</td>
            </tr>
            <tr style="background: #ecfdf5;">
              <td style="padding: 10px; font-size: 14px; font-weight: bold; color: #047857;">Amount Received (Cash / Bank):</td>
              <td style="text-align: right; padding: 10px; font-size: 15px; font-weight: 900; color: #047857;">Rs. ${formatPKR(amountReceived)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 13px; font-weight: bold; color: #b91c1c;">Remaining Account Balance:</td>
              <td style="text-align: right; padding: 10px; font-size: 14px; font-weight: 900; color: #b91c1c;">Rs. ${formatPKR(remainingBalance)}</td>
            </tr>
          </table>
        `}

        <table class="signature-table">
          <tr>
            <td>
              <div class="signature-line">Customer Signature</div>
            </td>
            <td style="text-align: right;">
              <div class="signature-line" style="margin-left: auto;">Authorized Store Stamp</div>
            </td>
          </tr>
        </table>

        <div class="footer">
          <p>This is a permanent historical business document. Computer generated A4 invoice — No signature required.</p>
          <p>Al-Noor Grocery Management System — Thank you for your business!</p>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Please allow popups to export A4 Invoice PDF.');
  }
}

export function printHtmlDocument(title: string, bodyHtml: string) {
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (printWindow) {
    const doc = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: sans-serif; color: #111827; margin: 0; padding: 20px; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #047857; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 11px; font-weight: 700; border-bottom: 1px solid #d1d5db; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
            .footer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #9ca3af; text-align: center; font-size: 10px; color: #6b7280; }
          </style>
        </head>
        <body>
          ${bodyHtml}
          <script>
            window.onload = function() { window.focus(); window.print(); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(doc);
    printWindow.document.close();
  } else {
    window.print();
  }
}
