import { describe, it, expect } from 'vitest';
import { computePrintPages, getTableMetrics } from './print-flow';
import { STARTER_80MM_RECEIPT, STARTER_4X6_LABEL, TemplateSchema } from '@/types/print-designer';

function makeItems(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Product ${i + 1}`,
    sku: `SKU-${i + 1}`,
    qty: 1,
    price: 1,
    total: 1,
  }));
}

// A fixed 4x6 template WITH a product table and totals below it,
// mirroring an invoice printed on label stock.
const FIXED_4X6_INVOICE: TemplateSchema = {
  ...STARTER_4X6_LABEL,
  elements: [
    { id: 'h', type: 'store_name', label: 'Store', enabled: true, content: 'STORE', x: 6, y: 6, width: 90, height: 8, zIndex: 1, style: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' } },
    { id: 't', type: 'product_table', label: 'Items', enabled: true, x: 6, y: 18, width: 90, height: 40, zIndex: 2, style: { fontSize: 10 } },
    { id: 'g', type: 'grand_total', label: 'Total', enabled: true, content: 'TOTAL', x: 6, y: 62, width: 90, height: 8, zIndex: 3, style: { fontSize: 12, fontWeight: 'bold' } },
    { id: 'f', type: 'footer_text', label: 'Footer', enabled: true, content: 'Thanks', x: 6, y: 72, width: 90, height: 6, zIndex: 4, style: { fontSize: 9 } },
  ],
};

describe('continuous roll (80mm receipt)', () => {
  it('always produces exactly one page, no matter the item count', () => {
    for (const n of [1, 10, 100, 500]) {
      const pages = computePrintPages(STARTER_80MM_RECEIPT, n);
      expect(pages).toHaveLength(1);
    }
  });

  it('grows the page height as items are added', () => {
    const small = computePrintPages(STARTER_80MM_RECEIPT, 3)[0];
    const big = computePrintPages(STARTER_80MM_RECEIPT, 100)[0];
    expect(big.heightUnits).toBeGreaterThan(small.heightUnits);
  });

  it('shifts the grand total below the grown table', () => {
    const pages = computePrintPages(STARTER_80MM_RECEIPT, 100);
    const els = pages[0].elements;
    const table = els.find((e) => e.type === 'product_table')!;
    const total = els.find((e) => e.type === 'grand_total')!;
    expect(total.y).toBeGreaterThanOrEqual(table.y + table.height - 1);
  });

  it('renders every item exactly once', () => {
    const pages = computePrintPages(STARTER_80MM_RECEIPT, 42);
    const table = pages[0].elements.find((e) => e.type === 'product_table')!;
    expect(table.itemsSlice).toEqual([0, 42]);
  });
});

describe('fixed page (4x6 label invoice)', () => {
  it('stays on one page for a few items', () => {
    const pages = computePrintPages(FIXED_4X6_INVOICE, 3);
    expect(pages).toHaveLength(1);
    const types = pages[0].elements.map((e) => e.type);
    expect(types).toContain('store_name');
    expect(types).toContain('grand_total');
  });

  it('splits 100 items across multiple pages', () => {
    const pages = computePrintPages(FIXED_4X6_INVOICE, 100);
    expect(pages.length).toBeGreaterThan(1);
  });

  it('every page height equals the physical label height', () => {
    const pages = computePrintPages(FIXED_4X6_INVOICE, 100);
    for (const p of pages) {
      expect(p.heightUnits).toBe(FIXED_4X6_INVOICE.page.height);
    }
  });

  it('renders all 100 items exactly once across pages, in order', () => {
    const pages = computePrintPages(FIXED_4X6_INVOICE, 100);
    const slices = pages
      .flatMap((p) => p.elements)
      .filter((e) => e.type === 'product_table')
      .map((e) => e.itemsSlice!);
    let cursor = 0;
    for (const [start, end] of slices) {
      expect(start).toBe(cursor);
      expect(end).toBeGreaterThan(start);
      cursor = end;
    }
    expect(cursor).toBe(100);
  });

  it('places the totals block only on the last page, after the final rows', () => {
    const pages = computePrintPages(FIXED_4X6_INVOICE, 100);
    const last = pages[pages.length - 1];
    for (const p of pages.slice(0, -1)) {
      expect(p.elements.some((e) => e.type === 'grand_total')).toBe(false);
    }
    const lastTable = last.elements.find((e) => e.type === 'product_table');
    const total = last.elements.find((e) => e.type === 'grand_total')!;
    expect(total).toBeDefined();
    if (lastTable) {
      expect(total.y).toBeGreaterThanOrEqual(lastTable.y + lastTable.height - 1);
    }
  });

  it('shows the store header only on page 1', () => {
    const pages = computePrintPages(FIXED_4X6_INVOICE, 100);
    expect(pages[0].elements.some((e) => e.type === 'store_name')).toBe(true);
    for (const p of pages.slice(1)) {
      expect(p.elements.some((e) => e.type === 'store_name')).toBe(false);
    }
  });

  it('rows never overflow past the bottom margin', () => {
    const pages = computePrintPages(FIXED_4X6_INVOICE, 100);
    const limit = FIXED_4X6_INVOICE.page.height - FIXED_4X6_INVOICE.page.margins.bottom;
    for (const p of pages) {
      const table = p.elements.find((e) => e.type === 'product_table');
      if (table) {
        expect(table.y + table.height).toBeLessThanOrEqual(limit + 0.01);
      }
    }
  });
});

describe('templates without a product table (price tags)', () => {
  it('renders as designed on a single page', () => {
    const pages = computePrintPages(STARTER_4X6_LABEL, 100);
    expect(pages).toHaveLength(1);
    expect(pages[0].elements).toHaveLength(STARTER_4X6_LABEL.elements.length);
  });
});

describe('table metrics', () => {
  it('bigger fonts produce taller rows', () => {
    const small = getTableMetrics({ style: { fontSize: 8 } } as any, 'mm');
    const big = getTableMetrics({ style: { fontSize: 14 } } as any, 'mm');
    expect(big.rowHeightUnits).toBeGreaterThan(small.rowHeightUnits);
  });
});
