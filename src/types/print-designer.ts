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
  editor: {
    gridEnabled: true,
    gridSize: 2,
    snapEnabled: true,
  },
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
      id: 'e-line2',
      type: 'line',
      label: 'Divider Line',
      enabled: true,
      x: 4,
      y: 86,
      width: 72,
      height: 1,
      zIndex: 7,
      style: { borderWidth: 1, borderColor: '#000000', borderStyle: 'dashed' },
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
