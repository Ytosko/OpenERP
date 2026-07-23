/**
 * Print Flow Layout Engine
 *
 * The designer canvas positions elements absolutely with a FIXED product-table
 * height. Real sales have any number of line items, so at render time we:
 *   1. Grow the product table to fit every item row.
 *   2. Shift every element that sits below the table down by the growth delta.
 *   3. continuous rolls (80mm/58mm/104mm thermal): the page simply gets longer —
 *      a roll never needs page breaks.
 *   4. fixed pages (4x6 labels, A-series): content that no longer fits is split
 *      across multiple pages — item rows flow page to page (with the table
 *      header repeated), and the below-table block (totals, barcode, footer)
 *      always lands after the final row on the last page.
 */

import { TemplateSchema, PrintElement, PageUnit } from '@/types/print-designer';

/** CSS reference pixel → page unit conversion (96 px per inch). */
const UNIT_PER_PX: Record<PageUnit, number> = {
  mm: 25.4 / 96,
  cm: 2.54 / 96,
  inch: 1 / 96,
  px: 1,
};

export function pxToUnit(px: number, unit: PageUnit): number {
  return px * UNIT_PER_PX[unit];
}

export interface PlacedElement extends PrintElement {
  /** For product_table fragments: which slice of the items array to render. */
  itemsSlice?: [number, number];
  /** Repeat the table header on this fragment (true on every fragment). */
  showTableHeader?: boolean;
}

export interface PagePlan {
  pageIndex: number;
  /** Page height in schema units (grows for continuous rolls). */
  heightUnits: number;
  elements: PlacedElement[];
}

export interface FlowMetrics {
  rowHeightUnits: number;
  headerHeightUnits: number;
}

export function getTableMetrics(table: PrintElement, unit: PageUnit): FlowMetrics {
  const fontSize = table.style.fontSize || 10;
  const lineHeight = table.style.lineHeight || 1.45;
  // Each item row is one text line plus a small vertical gap.
  const rowPx = fontSize * lineHeight + 2;
  // Header row: same line plus its bottom border and margin.
  const headerPx = fontSize * lineHeight + 6;
  return {
    rowHeightUnits: pxToUnit(rowPx, unit),
    headerHeightUnits: pxToUnit(headerPx, unit),
  };
}

/**
 * Computes the page-by-page layout for a template rendered with `itemCount`
 * product rows. Always returns at least one page.
 */
export function computePrintPages(schema: TemplateSchema, itemCount: number): PagePlan[] {
  const { page } = schema;
  const els = schema.elements.filter((e) => e.enabled);
  const table = els.find((e) => e.type === 'product_table');

  const designedBottom = Math.max(0, ...els.map((e) => e.y + e.height));
  const designedPageHeight =
    page.mode === 'fixed' ? page.height : Math.max(page.height || 0, designedBottom + page.margins.bottom);

  // No table (labels/price tags) or no items: render exactly as designed.
  if (!table || itemCount <= 0) {
    return [
      {
        pageIndex: 0,
        heightUnits: designedPageHeight,
        elements: els.map((e) => ({ ...e })),
      },
    ];
  }

  const { rowHeightUnits: rowH, headerHeightUnits: headH } = getTableMetrics(table, page.unit);
  const neededTableH = headH + itemCount * rowH;

  const above = els.filter((e) => e.id !== table.id && e.y < table.y);
  const below = els.filter((e) => e.id !== table.id && e.y >= table.y);
  const designedTableEnd = table.y + table.height;

  // ---------------- CONTINUOUS ROLL: one page that simply grows ----------------
  if (page.mode !== 'fixed') {
    const delta = Math.max(0, neededTableH - table.height);
    const placed: PlacedElement[] = [
      ...above.map((e) => ({ ...e })),
      {
        ...table,
        height: Math.max(table.height, neededTableH),
        itemsSlice: [0, itemCount] as [number, number],
        showTableHeader: true,
      },
      ...below.map((e) => ({ ...e, y: e.y + delta })),
    ];
    const bottom = Math.max(...placed.map((e) => e.y + e.height));
    return [
      {
        pageIndex: 0,
        heightUnits: Math.max(designedPageHeight, bottom + page.margins.bottom),
        elements: placed,
      },
    ];
  }

  // ---------------- FIXED PAGE: paginate ----------------
  const pageH = page.height;
  const bottomLimit = pageH - page.margins.bottom;

  // Height of the below-table block, preserving its designed gap after the table.
  const belowGap = below.length > 0 ? Math.min(...below.map((e) => e.y)) - designedTableEnd : 0;
  const belowBlockH =
    below.length > 0 ? Math.max(...below.map((e) => e.y + e.height)) - Math.min(...below.map((e) => e.y)) : 0;

  const pages: PagePlan[] = [];
  let rendered = 0; // item rows placed so far
  let pageIndex = 0;

  while (rendered < itemCount || pageIndex === 0) {
    const isFirst = pageIndex === 0;
    const tableTop = isFirst ? table.y : page.margins.top;
    const availForTable = bottomLimit - tableTop - headH;
    const rowsFitting = Math.max(1, Math.floor(availForTable / rowH));
    const remaining = itemCount - rendered;

    // Can the remaining rows AND the below block share this page?
    const fitsWithBelow =
      remaining <= rowsFitting &&
      tableTop + headH + remaining * rowH + Math.max(0, belowGap) + belowBlockH <= bottomLimit;

    const rowsThisPage = fitsWithBelow ? remaining : Math.min(remaining, rowsFitting);
    const tableH = headH + rowsThisPage * rowH;

    const placed: PlacedElement[] = [];
    if (isFirst) {
      placed.push(...above.map((e) => ({ ...e })));
    }
    placed.push({
      ...table,
      y: tableTop,
      height: tableH,
      itemsSlice: [rendered, rendered + rowsThisPage] as [number, number],
      showTableHeader: true,
    });

    rendered += rowsThisPage;

    if (rendered >= itemCount) {
      // Last rows placed — attach the below block after the table end.
      const tableEnd = tableTop + tableH;
      if (fitsWithBelow || below.length === 0) {
        const minBelowY = below.length > 0 ? Math.min(...below.map((e) => e.y)) : 0;
        placed.push(
          ...below.map((e) => ({
            ...e,
            y: tableEnd + Math.max(0, belowGap) + (e.y - minBelowY),
          }))
        );
        pages.push({ pageIndex, heightUnits: pageH, elements: placed });
        break;
      }
      // Below block does not fit after the final rows — give it its own page.
      pages.push({ pageIndex, heightUnits: pageH, elements: placed });
      pageIndex += 1;
      const minBelowY = below.length > 0 ? Math.min(...below.map((e) => e.y)) : 0;
      pages.push({
        pageIndex,
        heightUnits: pageH,
        elements: below.map((e) => ({
          ...e,
          y: page.margins.top + (e.y - minBelowY),
        })),
      });
      break;
    }

    pages.push({ pageIndex, heightUnits: pageH, elements: placed });
    pageIndex += 1;

    // Runaway guard: a malformed schema must never loop forever.
    if (pageIndex > 500) break;
  }

  return pages;
}
