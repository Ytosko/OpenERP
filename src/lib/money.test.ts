import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  dollarsToCents,
  centsToDollars,
  formatMoney,
  formatCents,
  calculateCartTotals,
  calculateCartTotalsCents,
} from './money';

describe('cents conversion', () => {
  it('converts dollars to integer cents', () => {
    expect(toCents(4.25)).toBe(425);
    expect(toCents(0.1)).toBe(10);
    expect(toCents(149.99)).toBe(14999);
  });

  it('survives classic IEEE 754 traps', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in raw floats
    expect(toCents(0.1 + 0.2)).toBe(30);
    // 1.005 * 100 === 100.49999... in raw floats
    expect(toCents(1.005)).toBe(101);
  });

  it('handles invalid input without NaN propagation', () => {
    expect(dollarsToCents(NaN)).toBe(0);
    expect(centsToDollars(NaN)).toBe(0);
    expect(toCents(undefined as unknown as number)).toBe(0);
  });

  it('round-trips cents to dollars', () => {
    expect(fromCents(425)).toBe(4.25);
    expect(fromCents(1)).toBe(0.01);
  });
});

describe('formatting', () => {
  it('formats dollars and cents with two decimals', () => {
    expect(formatMoney(5)).toBe('$5.00');
    expect(formatMoney(5.5)).toBe('$5.50');
    expect(formatCents(1234)).toBe('$12.34');
    expect(formatCents(1234, '€')).toBe('€12.34');
  });
});

describe('calculateCartTotals (dollar API)', () => {
  it('sums line items exactly', () => {
    const totals = calculateCartTotals([
      { unit_price: 4.25, quantity: 2 },
      { unit_price: 3.75, quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(12.25);
    expect(totals.grandTotal).toBe(12.25);
  });

  it('has no float drift for 3 × $0.10', () => {
    const totals = calculateCartTotals([{ unit_price: 0.1, quantity: 3 }]);
    expect(totals.subtotalCents).toBe(30);
    expect(totals.subtotal).toBe(0.3);
  });

  it('applies tax with integer rounding: 3 × $0.10 at 7.5%', () => {
    const totals = calculateCartTotals([{ unit_price: 0.1, quantity: 3 }], 0, 7.5);
    // 30c * 7.5% = 2.25c → rounds to 2c
    expect(totals.taxCents).toBe(2);
    expect(totals.grandTotalCents).toBe(32);
    expect(totals.grandTotal).toBe(0.32);
  });

  it('clamps discount to the subtotal (no negative totals)', () => {
    const totals = calculateCartTotals([{ unit_price: 5, quantity: 1 }], 10);
    expect(totals.discount).toBe(5);
    expect(totals.grandTotal).toBe(0);
  });

  it('applies discount before tax', () => {
    const totals = calculateCartTotals([{ unit_price: 10, quantity: 1 }], 2, 10);
    // (1000c - 200c) * 10% = 80c tax
    expect(totals.taxCents).toBe(80);
    expect(totals.grandTotalCents).toBe(880);
  });

  it('ignores negative quantities instead of crediting money', () => {
    const totals = calculateCartTotals([{ unit_price: 5, quantity: -2 }]);
    expect(totals.subtotal).toBe(0);
  });
});

describe('calculateCartTotalsCents (integer API)', () => {
  it('supports per-line discounts', () => {
    const totals = calculateCartTotalsCents([
      { unit_price_cents: 500, quantity: 2, discount_cents: 50 },
    ]);
    expect(totals.subtotalCents).toBe(900);
  });

  it('never produces fractional cents', () => {
    const totals = calculateCartTotalsCents(
      [{ unit_price_cents: 333, quantity: 3 }],
      0,
      8.875 // NYC-style tax rate
    );
    expect(Number.isInteger(totals.taxCents)).toBe(true);
    expect(Number.isInteger(totals.grandTotalCents)).toBe(true);
  });
});
