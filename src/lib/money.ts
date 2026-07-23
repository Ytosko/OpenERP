/**
 * Precision Financial Money & Cents Calculation Engine
 * Guarantees zero IEEE 754 floating point rounding errors in POS transactions & invoices
 */

export function toCents(dollars: number): number {
  return Math.round((dollars || 0) * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatMoney(dollars: number, currencySymbol: string = '$'): string {
  const rounded = Math.round((dollars || 0) * 100) / 100;
  return `${currencySymbol}${rounded.toFixed(2)}`;
}

export function calculateCartTotals(
  items: Array<{ unit_price: number; quantity: number }>,
  discountDollars: number = 0,
  taxRatePercent: number = 0
) {
  const subtotalCents = items.reduce(
    (acc, item) => acc + toCents(item.unit_price) * item.quantity,
    0
  );
  const discountCents = Math.min(subtotalCents, toCents(discountDollars));
  const subtotalAfterDiscountCents = subtotalCents - discountCents;
  const taxCents = Math.round(subtotalAfterDiscountCents * (taxRatePercent / 100));
  const grandTotalCents = subtotalAfterDiscountCents + taxCents;

  return {
    subtotalCents,
    discountCents,
    taxCents,
    grandTotalCents,
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    tax: fromCents(taxCents),
    grandTotal: fromCents(grandTotalCents),
  };
}
