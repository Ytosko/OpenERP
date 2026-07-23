/**
 * Precision Monetary Money & Cents Calculation Engine
 * All arithmetic happens on integer minor units (cents) to prevent
 * IEEE 754 floating point errors on prices, discounts, and taxes.
 * Dollar-denominated wrappers are provided for UI code that renders decimals.
 */

export function dollarsToCents(dollars: number): number {
  if (typeof dollars !== 'number' || isNaN(dollars)) return 0;
  // Normalize float representation error before rounding: 1.005 * 100 is
  // 100.49999999999999 in IEEE 754 and would otherwise round DOWN to 100.
  return Math.round(Number((dollars * 100).toPrecision(15)));
}

export function centsToDollars(cents: number): number {
  if (typeof cents !== 'number' || isNaN(cents)) return 0;
  return Math.round(cents) / 100;
}

export const toCents = dollarsToCents;
export const fromCents = centsToDollars;

export function formatCents(cents: number, symbol: string = '$'): string {
  const dollars = centsToDollars(cents);
  return `${symbol}${dollars.toFixed(2)}`;
}

export function formatMoney(dollars: number, symbol: string = '$'): string {
  return formatCents(dollarsToCents(dollars), symbol);
}

export interface CartLineItem {
  unit_price_cents: number;
  quantity: number;
  discount_cents?: number;
}

export function calculateCartTotalsCents(
  items: CartLineItem[],
  globalDiscountCents: number = 0,
  taxRatePercent: number = 0
) {
  const subtotalCents = items.reduce((acc, item) => {
    const linePrice = Math.max(0, item.unit_price_cents - (item.discount_cents || 0));
    return acc + linePrice * Math.max(0, item.quantity);
  }, 0);

  const appliedDiscountCents = Math.min(subtotalCents, Math.max(0, globalDiscountCents));
  const subtotalAfterDiscount = subtotalCents - appliedDiscountCents;

  const taxCents = Math.round(subtotalAfterDiscount * (taxRatePercent / 100));
  const grandTotalCents = subtotalAfterDiscount + taxCents;

  return {
    subtotalCents,
    discountCents: appliedDiscountCents,
    taxCents,
    grandTotalCents,
    subtotalDollars: centsToDollars(subtotalCents),
    discountDollars: centsToDollars(appliedDiscountCents),
    taxDollars: centsToDollars(taxCents),
    grandTotalDollars: centsToDollars(grandTotalCents),
  };
}

/**
 * Dollar-denominated wrapper around calculateCartTotalsCents for cart items
 * shaped as { unit_price, quantity, discount? } in dollars.
 */
export function calculateCartTotals(
  items: Array<{ unit_price: number; quantity: number; discount?: number }>,
  discountDollars: number = 0,
  taxRatePercent: number = 0
) {
  const totals = calculateCartTotalsCents(
    items.map((item) => ({
      unit_price_cents: dollarsToCents(item.unit_price),
      quantity: item.quantity,
      discount_cents: dollarsToCents(item.discount || 0),
    })),
    dollarsToCents(discountDollars),
    taxRatePercent
  );

  return {
    ...totals,
    subtotal: totals.subtotalDollars,
    discount: totals.discountDollars,
    tax: totals.taxDollars,
    grandTotal: totals.grandTotalDollars,
  };
}
