export type PageUnit = 'mm' | 'cm' | 'inch' | 'px';
export type PageMode = 'fixed' | 'continuous';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type ElementType =
  | 'text'
  | 'image'
  | 'logo'
  | 'line'
  | 'rectangle'
  | 'store_name'
  | 'store_address'
  | 'customer_info'
  | 'invoice_number'
  | 'date_time'
  | 'cashier_name'
  | 'product_table'
  | 'subtotal'
  | 'tax_total'
  | 'discount_total'
  | 'grand_total'
  | 'payment_info'
  | 'qr_code'
  | 'barcode'
  | 'footer_text';

export interface ElementStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  objectFit?: 'contain' | 'cover';
  lineHeight?: number;
  fontFamily?: string;
}

export interface PrintElement {
  id: string;
  type: ElementType;
  label: string;
  enabled: boolean;
  binding?: string; // e.g. "invoice.number", "project.name"
  content?: string; // raw custom text or format
  x: number; // in unit
  y: number; // in unit
  width: number; // in unit
  height: number; // in unit
  rotation?: number;
  zIndex: number;
  locked?: boolean;
  condition?: string; // plain text rule e.g. "tax > 0"
  style: ElementStyle;
}

export interface TemplateSchema {
  id: string;
  name: string;
  version: number;
  page: {
    mode: PageMode;
    width: number;
    height: number; // if fixed
    unit: PageUnit;
    orientation: PageOrientation;
    margins: PageMargins;
    dpi: number;
    background?: string;
  };
  editor: {
    gridEnabled: boolean;
    gridSize: number;
    snapEnabled: boolean;
  };
  elements: PrintElement[];
}

export const STARTER_80MM_RECEIPT: TemplateSchema = {
  id: 'tmpl-80mm',
  name: '80mm Thermal Receipt (Standard)',
  version: 1,
  page: {
    mode: 'continuous',
    width: 80,
    height: 150,
    unit: 'mm',
    orientation: 'portrait',
    margins: { top: 3, right: 3, bottom: 3, left: 3 },
    dpi: 203,
  },
  editor: { gridEnabled: true, gridSize: 2, snapEnabled: true },
  elements: [
    {
      id: 'e-logo',
      type: 'logo',
      label: 'Store Logo',
      enabled: true,
      binding: 'project.logo_url',
      x: 25,
      y: 4,
      width: 30,
      height: 15,
      zIndex: 1,
      style: { textAlign: 'center', objectFit: 'contain' },
    },
    {
      id: 'e-name',
      type: 'store_name',
      label: 'Store Name',
      enabled: true,
      binding: 'project.name',
      content: 'HACKER MART POS',
      x: 4,
      y: 20,
      width: 72,
      height: 8,
      zIndex: 2,
      style: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    },
    {
      id: 'e-address',
      type: 'store_address',
      label: 'Store Address',
      enabled: true,
      binding: 'store.address',
      content: '100 Technology Way, San Francisco, CA',
      x: 4,
      y: 28,
      width: 72,
      height: 6,
      zIndex: 3,
      style: { fontSize: 10, textAlign: 'center', color: '#475569' },
    },
    {
      id: 'e-line1',
      type: 'line',
      label: 'Divider Line',
      enabled: true,
      x: 4,
      y: 35,
      width: 72,
      height: 1,
      zIndex: 4,
      style: { borderWidth: 1, borderColor: '#000000', borderStyle: 'dashed' },
    },
    {
      id: 'e-meta',
      type: 'invoice_number',
      label: 'Invoice Details',
      enabled: true,
      binding: 'invoice.number',
      content: 'INVOICE: {{invoice.number}}',
      x: 4,
      y: 37,
      width: 72,
      height: 6,
      zIndex: 5,
      style: { fontSize: 10, fontWeight: 'bold', textAlign: 'left' },
    },
    {
      id: 'e-table',
      type: 'product_table',
      label: 'Purchased Items Table',
      enabled: true,
      x: 4,
      y: 45,
      width: 72,
      height: 40,
      zIndex: 6,
      style: { fontSize: 10, fontFamily: 'monospace' },
    },
    {
      id: 'e-grandtotal',
      type: 'grand_total',
      label: 'Grand Total',
      enabled: true,
      binding: 'invoice.grand_total',
      content: 'TOTAL: ${{invoice.grand_total}}',
      x: 4,
      y: 88,
      width: 72,
      height: 8,
      zIndex: 8,
      style: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
    },
    {
      id: 'e-barcode',
      type: 'barcode',
      label: 'Invoice Barcode',
      enabled: true,
      binding: 'invoice.number',
      x: 15,
      y: 98,
      width: 50,
      height: 12,
      zIndex: 9,
      style: { textAlign: 'center' },
    },
    {
      id: 'e-qr',
      type: 'qr_code',
      label: 'Verification QR',
      enabled: true,
      binding: 'invoice.id',
      x: 30,
      y: 112,
      width: 20,
      height: 20,
      zIndex: 10,
      style: { textAlign: 'center' },
    },
    {
      id: 'e-footer',
      type: 'footer_text',
      label: 'Footer Note',
      enabled: true,
      content: 'Thank you for shopping with us! Please keep receipt for returns.',
      x: 4,
      y: 134,
      width: 72,
      height: 8,
      zIndex: 11,
      style: { fontSize: 9, textAlign: 'center', color: '#334155' },
    },
  ],
};

export const STARTER_58MM_RECEIPT: TemplateSchema = {
  id: 'tmpl-58mm',
  name: '58mm Mini Thermal Receipt',
  version: 1,
  page: {
    mode: 'continuous',
    width: 58,
    height: 120,
    unit: 'mm',
    orientation: 'portrait',
    margins: { top: 2, right: 2, bottom: 2, left: 2 },
    dpi: 203,
  },
  editor: { gridEnabled: true, gridSize: 2, snapEnabled: true },
  elements: [
    { id: 'e-58-name', type: 'store_name', label: 'Store Name', enabled: true, content: 'MINI MART', x: 2, y: 5, width: 54, height: 6, zIndex: 1, style: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' } },
    { id: 'e-58-table', type: 'product_table', label: 'Items Table', enabled: true, x: 2, y: 15, width: 54, height: 30, zIndex: 2, style: { fontSize: 8 } },
    { id: 'e-58-total', type: 'grand_total', label: 'Grand Total', enabled: true, content: 'TOTAL: ${{invoice.grand_total}}', x: 2, y: 50, width: 54, height: 6, zIndex: 3, style: { fontSize: 12, fontWeight: 'bold', textAlign: 'right' } },
  ],
};

export const STARTER_4X6_LABEL: TemplateSchema = {
  id: 'tmpl-4x6-label',
  name: '102mm x 152mm (4x6 Inch Shipping Label)',
  version: 1,
  page: {
    mode: 'fixed',
    width: 102,
    height: 152,
    unit: 'mm',
    orientation: 'portrait',
    margins: { top: 4, right: 4, bottom: 4, left: 4 },
    dpi: 300,
  },
  editor: { gridEnabled: true, gridSize: 2, snapEnabled: true },
  elements: [
    { id: 'e-label-title', type: 'text', label: 'Label Title', enabled: true, content: 'EXPRESS SHIPPING LABEL', x: 6, y: 8, width: 90, height: 10, zIndex: 1, style: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' } },
    { id: 'e-label-barcode', type: 'barcode', label: 'Tracking Barcode', enabled: true, x: 11, y: 25, width: 80, height: 25, zIndex: 2, style: { textAlign: 'center' } },
    { id: 'e-label-qr', type: 'qr_code', label: 'QR Code', enabled: true, x: 36, y: 60, width: 30, height: 30, zIndex: 3, style: { textAlign: 'center' } },
    { id: 'e-label-footer', type: 'footer_text', label: 'Footer Note', enabled: true, content: 'HANDLE WITH CARE - FRAGILE', x: 6, y: 100, width: 90, height: 8, zIndex: 4, style: { fontSize: 10, textAlign: 'center', fontWeight: 'bold' } },
  ],
};

export const STARTER_60X40_LABEL: TemplateSchema = {
  id: 'tmpl-60x40',
  name: '60mm x 40mm Product Barcode Tag',
  version: 1,
  page: {
    mode: 'fixed',
    width: 60,
    height: 40,
    unit: 'mm',
    orientation: 'portrait',
    margins: { top: 2, right: 2, bottom: 2, left: 2 },
    dpi: 203,
  },
  editor: { gridEnabled: true, gridSize: 1, snapEnabled: true },
  elements: [
    { id: 'e-60-name', type: 'store_name', label: 'Item Name', enabled: true, content: 'Double Espresso 12oz', x: 2, y: 2, width: 56, height: 6, zIndex: 1, style: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' } },
    { id: 'e-60-price', type: 'grand_total', label: 'Price', enabled: true, content: '$3.75', x: 2, y: 9, width: 56, height: 6, zIndex: 2, style: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' } },
    { id: 'e-60-barcode', type: 'barcode', label: 'Barcode', enabled: true, x: 5, y: 16, width: 50, height: 18, zIndex: 3, style: { textAlign: 'center' } },
  ],
};

export const STARTER_50X30_LABEL: TemplateSchema = {
  id: 'tmpl-50x30',
  name: '50mm x 30mm Retail Price Tag',
  version: 1,
  page: {
    mode: 'fixed',
    width: 50,
    height: 30,
    unit: 'mm',
    orientation: 'portrait',
    margins: { top: 2, right: 2, bottom: 2, left: 2 },
    dpi: 203,
  },
  editor: { gridEnabled: true, gridSize: 1, snapEnabled: true },
  elements: [
    { id: 'e-50-name', type: 'store_name', label: 'Item Name', enabled: true, content: 'Oat Milk Latte', x: 2, y: 2, width: 46, height: 5, zIndex: 1, style: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' } },
    { id: 'e-50-barcode', type: 'barcode', label: 'Barcode', enabled: true, x: 5, y: 8, width: 40, height: 15, zIndex: 2, style: { textAlign: 'center' } },
    { id: 'e-50-price', type: 'grand_total', label: 'Price', enabled: true, content: '$5.50', x: 2, y: 24, width: 46, height: 4, zIndex: 3, style: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' } },
  ],
};

export interface LabelDimensionPreset {
  name: string;
  width: number;
  height: number;
  unit: PageUnit;
  mode: PageMode;
}

export const INDUSTRIAL_LABEL_PRESETS: LabelDimensionPreset[] = [
  { name: '102mm x 152mm (4" x 6" Shipping Label)', width: 102, height: 152, unit: 'mm', mode: 'fixed' },
  { name: '101mm x 151mm (Shipping Label)', width: 101, height: 151, unit: 'mm', mode: 'fixed' },
  { name: '101mm x 50mm (Large Product Tag)', width: 101, height: 50, unit: 'mm', mode: 'fixed' },
  { name: '82mm x 102mm (Medium Tag)', width: 82, height: 102, unit: 'mm', mode: 'fixed' },
  { name: '82mm x 51mm (Address Label)', width: 82, height: 51, unit: 'mm', mode: 'fixed' },
  { name: '60mm x 40mm (Standard Barcode Label)', width: 60, height: 40, unit: 'mm', mode: 'fixed' },
  { name: '56mm x 38mm (Product Tag)', width: 56, height: 38, unit: 'mm', mode: 'fixed' },
  { name: '50mm x 75mm (Vertical Tag)', width: 50, height: 75, unit: 'mm', mode: 'fixed' },
  { name: '50mm x 38mm (Product Label)', width: 50, height: 38, unit: 'mm', mode: 'fixed' },
  { name: '50mm x 30mm (Retail Price Tag)', width: 50, height: 30, unit: 'mm', mode: 'fixed' },
  { name: '50mm x 25mm (Small Tag)', width: 50, height: 25, unit: 'mm', mode: 'fixed' },
  { name: '38mm x 25mm (Jewelry & Small Item)', width: 38, height: 25, unit: 'mm', mode: 'fixed' },
  { name: '80mm Continuous Thermal Roll', width: 80, height: 150, unit: 'mm', mode: 'continuous' },
  { name: '58mm Continuous Thermal Roll', width: 58, height: 120, unit: 'mm', mode: 'continuous' },
  { name: '104mm Continuous Label Roll', width: 104, height: 180, unit: 'mm', mode: 'continuous' },
];
