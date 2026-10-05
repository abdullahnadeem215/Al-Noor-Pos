# Al-Noor Mart - Authoritative Business Rules Document

## 1. Weight Units & Weight Calculations Engine

### Conversions Matrix
- `1 kg` = `1000 grams`
- `0.5 kg` = `500 grams` (half kg)
- `1 pao` = `250 grams`
- `2 pao` = `500 grams`
- Internal stock storage for weight products is ALWAYS normalized to **Grams** (`DECIMAL(12,3)`).

### Weight-Based Price Calculation Formula
When selling a weight product by specified weight (e.g. 250g of Sugar @ PKR 180/kg):
$$\text{Total Price} = \frac{\text{weight\_grams}}{1000} \times \text{base\_price\_per\_kg}$$

**Example**:
- Product: Sugar
- Base Price: PKR 180 / kg
- Weight Requested: `250g` (1 pao)
- Calculation: $\frac{250}{1000} \times 180 = 0.25 \times 180 = \text{PKR } 45.00$

### Amount-Based Weight Calculation Formula
When customer buys by monetary amount (e.g. "PKR 100 ki sugar" @ PKR 180/kg):
$$\text{Calculated Grams} = \frac{\text{amount}}{\text{base\_price\_per\_kg}} \times 1000$$

**Example**:
- Product: Sugar
- Base Price: PKR 180 / kg
- Amount Requested: `PKR 100`
- Calculation: $\frac{100}{180} \times 1000 = 555.555555... \text{ grams}$
- Display / Cart: `555.56g` for PKR 100.00.
- Internal Stock Deduction: `555.556g`.

## 2. Quantity-Based Selling Rules
- Products with `selling_mode = quantity` are sold strictly in integer or decimal piece counts.
$$\text{Total Price} = \text{quantity} \times \text{unit\_base\_price}$$
- Weight-based operations (grams/pao/amount) on quantity products MUST be rejected with HTTP `422 Unprocessable Entity`.
- Quantity operations on weight products MUST be rejected with HTTP `422 Unprocessable Entity`.

## 3. Historical Transaction Snapshot Protection
- Product price changes (e.g., Sugar price increases from PKR 180 to PKR 200/kg) MUST NOT affect historical sales or return invoices.
- Every `sale_item` stores:
  - `product_name_snapshot`
  - `unit_base_price_snapshot`
  - `selling_mode`
- Future returns recalculate refunds strictly based on snapshot prices.

## 4. Inventory Rules & Stock Deductions
1. Stock deducted upon sale finalization:
   - Weight product stock in grams: `new_stock = old_stock - weight_grams`
   - Quantity product stock in units: `new_stock = old_stock - quantity`
2. Stock added upon purchase completion:
   - Weight product stock in grams: `new_stock = old_stock + purchase_weight_grams`
   - Quantity product stock in units: `new_stock = old_stock + purchase_quantity`
3. Negative stock is rejected unless `settings.negative_stock_allowed` is set to true.
4. All movements create an immutable audit record in `inventory_movements`.

## 5. Credit Ledger & Customer Accounts
- When a sale total is PKR 5,000 and paid amount is PKR 2,000:
  - `due_amount` = PKR 3,000
  - `payment_status` = `'partial'` or `'credit'`
  - Debit entry created in `credit_ledgers`: `debit` = PKR 3,000, customer `current_balance` increases by PKR 3,000.
- Customer payment reduces `current_balance` with a credit entry.

## 6. Daily Closing Rules
- Only one active closing record permitted per business date unless explicitly reopened by an Owner.
- `expected_cash` = `opening_cash` + `cash_sales` + `customer_cash_payments` - `cash_expenses` - `cash_refunds`.
- `difference` = `actual_cash` - `expected_cash`.

## 7. Discount & Tax Exclusion Directive
- As explicitly instructed, Discount and Tax calculations/fields are **EXCLUDED** from this version.
- In sales, purchases, and cart calculations: `Total = Subtotal`.

## 8. FBR / PRAL Exemption Rule
- System is designed purely for private wholesale/retail business operations.
- NO fake FBR invoice numbers, fake QR codes, or fake government tax tokens shall be output or created.

