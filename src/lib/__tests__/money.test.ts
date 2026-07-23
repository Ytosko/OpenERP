import { describe, it, expect } from 'vitest';
import {
  dollarsToCents,
  centsToDollars,
  formatCents,
  calculateCartTotalsCents,
} from '../money';

describe('Money Cents Engine Unit Tests', () => {
  it('correctly converts dollars to integer cents without floating point precision drift', () => {
    expect(dollarsToCents(3.75)).toBe(375);
    expect(dollarsToCents(0.1)).toBe(10);
    expect(dollarsToCents(0.2)).toBe(20);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
    expect(dollarsToCents(149.99)).toBe(14999);
  });

  it('correctly converts integer cents back to dollars', () => {
    expect(centsToDollars(375)).toBe(3.75);
    expect(centsToDollars(10)).toBe(0.1);
    expect(centsToDollars(14999)).toBe(149.99);
    expect(centsToDollars(0)).toBe(0);
  });

  it('formats cents cleanly with currency symbol', () => {
    expect(formatCents(375, '$')).toBe('$3.75');
    expect(formatCents(14999, '$')).toBe('$149.99');
    expect(formatCents(50, '€')).toBe('€0.50');
  });

  it('calculates cart subtotal and grand total for basic items', () => {
    const items = [
      { unit_price_cents: 375, quantity: 2 }, // $7.50 (750c)
      { unit_price_cents: 425, quantity: 1 }, // $4.25 (425c)
    ];

    const result = calculateCartTotalsCents(items, 0, 0);
    expect(result.subtotalCents).toBe(1175);
    expect(result.subtotalDollars).toBe(11.75);
    expect(result.grandTotalCents).toBe(1175);
    expect(result.grandTotalDollars).toBe(11.75);
  });

  it('handles per-line discounts and global discounts correctly', () => {
    const items = [
      { unit_price_cents: 1000, discount_cents: 200, quantity: 1 }, // Net $8.00 (800c)
    ];

    const result = calculateCartTotalsCents(items, 100, 0); // $1.00 global discount
    expect(result.subtotalCents).toBe(800);
    expect(result.discountCents).toBe(100);
    expect(result.grandTotalCents).toBe(700);
    expect(result.grandTotalDollars).toBe(7.00);
  });

  it('handles rounding edge cases: 3 x $0.10 at 7.5% tax rate', () => {
    // 3 x $0.10 = $0.30 (30c)
    // Tax: 30c * 7.5% = 2.25c -> rounded to nearest integer cent = 2c
    // Grand Total: 30c + 2c = 32c ($0.32)
    const items = [{ unit_price_cents: 10, quantity: 3 }];
    const result = calculateCartTotalsCents(items, 0, 7.5);

    expect(result.subtotalCents).toBe(30);
    expect(result.taxCents).toBe(2);
    expect(result.grandTotalCents).toBe(32);
    expect(result.grandTotalDollars).toBe(0.32);
  });

  it('handles zero & invalid inputs safely without throwing errors', () => {
    expect(dollarsToCents(NaN)).toBe(0);
    expect(centsToDollars(NaN)).toBe(0);

    const emptyResult = calculateCartTotalsCents([]);
    expect(emptyResult.subtotalCents).toBe(0);
    expect(emptyResult.grandTotalCents).toBe(0);
  });
});
