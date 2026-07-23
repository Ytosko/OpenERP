'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TemplateSchema, PrintElement } from '@/types/print-designer';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { generateRealBarcodeSvg, generateRealQrCodeSvg } from '@/lib/barcode-qr';
import { computePrintPages, PlacedElement } from '@/lib/print-flow';
import { Move, Trash2 } from 'lucide-react';

export interface PrintSampleData {
  storeLogoUrl?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  taxId?: string;
  invoiceNumber?: string;
  dateTime?: string;
  cashier?: string;
  customerName?: string;
  items?: Array<{ name: string; sku: string; qty: number; price: number; total: number }>;
  subtotal?: number;
  discount?: number;
  tax?: number;
  grandTotal?: number;
}

export interface PrintRendererProps {
  schema: TemplateSchema;
  sampleData?: PrintSampleData;
  className?: string;
  isPrintOnly?: boolean;
  /**
   * Flow layout mode: the product table grows to fit every item, elements
   * below it shift down, and fixed pages split into numbered pages.
   * Continuous rolls simply get longer. Editing is disabled in flow mode.
   */
  flow?: boolean;
}

export const DEFAULT_SAMPLE: PrintSampleData = {
  storeLogoUrl: '',
  storeName: 'MY STORE',
  storeAddress: '',
  storePhone: '',
  taxId: '',
  invoiceNumber: 'INV-20260723-00109',
  dateTime: new Date().toLocaleString(),
  cashier: 'Alex Cashier',
  customerName: 'Walk-in Customer',
  items: [
    { name: 'Double Espresso 12oz', sku: 'COF-101', qty: 2, price: 3.75, total: 7.5 },
    { name: 'Fresh Butter Croissant', sku: 'BAK-201', qty: 1, price: 4.25, total: 4.25 },
    { name: 'Oat Milk Latte 16oz', sku: 'COF-102', qty: 1, price: 5.5, total: 5.5 },
  ],
  subtotal: 17.25,
  discount: 1.0,
  tax: 1.38,
  grandTotal: 17.63,
};

function ElementContent({
  el,
  sampleData,
}: {
  el: PlacedElement;
  sampleData: PrintSampleData;
}): React.ReactElement {
  switch (el.type) {
    case 'logo': {
      const imageSrc = el.content || sampleData?.storeLogoUrl;
      return (
        <div className="w-full h-full flex items-center justify-center">
          {imageSrc ? (
            <img src={imageSrc} alt="Store Logo" className="max-w-full max-h-full object-contain pointer-events-none" />
          ) : (
            <div className="w-full h-full bg-slate-100 border border-dashed border-slate-400 text-slate-500 rounded flex items-center justify-center text-[8px] font-bold text-center leading-tight">
              NO LOGO — upload in Settings
            </div>
          )}
        </div>
      );
    }

    case 'store_name':
      return <div className="w-full truncate font-bold">{sampleData?.storeName || el.content || 'MY STORE'}</div>;

    case 'store_address':
      return (
        <div className="w-full text-[10px] leading-tight text-slate-700">
          <div>{sampleData?.storeAddress || el.content || 'Set your address in Store Branding & Settings'}</div>
          {sampleData?.storePhone && <div className="text-[9px] text-slate-500">Ph: {sampleData.storePhone}</div>}
        </div>
      );

    case 'customer_info':
      return (
        <div className="w-full text-[10px] text-slate-800">
          <span className="font-bold">CUSTOMER:</span> {sampleData?.customerName || 'Walk-in Customer'}
        </div>
      );

    case 'cashier_name':
      return (
        <div className="w-full text-[10px] text-slate-800">
          <span className="font-bold">CASHIER:</span> {sampleData?.cashier || 'Alex Cashier'}
        </div>
      );

    case 'date_time':
      return (
        <div className="w-full text-[10px] text-slate-800">
          <span className="font-bold">DATE:</span> {sampleData?.dateTime || new Date().toLocaleString()}
        </div>
      );

    case 'line':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderBottomWidth: `${el.style.borderWidth || 1}px`,
            borderBottomColor: el.style.borderColor || '#000000',
            borderBottomStyle: el.style.borderStyle || 'dashed',
          }}
        />
      );

    case 'invoice_number':
      return (
        <div className="w-full text-[11px] leading-snug">
          <div><span className="font-bold">INVOICE:</span> {sampleData.invoiceNumber}</div>
          <div className="text-[9px] text-slate-600">DATE: {sampleData.dateTime}</div>
        </div>
      );

    case 'product_table': {
      const allItems = sampleData.items || [];
      const [start, end] = el.itemsSlice || [0, allItems.length];
      const rows = allItems.slice(start, end);
      const showHeader = el.showTableHeader !== false;
      return (
        <div className="w-full text-[10px]">
          {showHeader && (
            <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1">
              <span>ITEM</span>
              <span>QTY</span>
              <span>TOTAL</span>
            </div>
          )}
          {rows.map((item, idx) => (
            <div key={start + idx} className="flex justify-between my-0.5">
              <span className="truncate w-1/2 font-semibold">{item.name}</span>
              <span className="w-1/6 text-center">{item.qty}</span>
              <span className="w-1/3 text-right">${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'subtotal':
      return (
        <div className="w-full text-[11px] flex justify-between">
          <span>SUBTOTAL:</span>
          <span>${(sampleData.subtotal ?? 0).toFixed(2)}</span>
        </div>
      );

    case 'discount_total':
      return (
        <div className="w-full text-[11px] flex justify-between">
          <span>DISCOUNT:</span>
          <span>-${(sampleData.discount ?? 0).toFixed(2)}</span>
        </div>
      );

    case 'tax_total':
      return (
        <div className="w-full text-[11px] flex justify-between">
          <span>TAX:</span>
          <span>${(sampleData.tax ?? 0).toFixed(2)}</span>
        </div>
      );

    case 'grand_total':
      return (
        <div className="w-full text-sm font-bold flex justify-between border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>${sampleData.grandTotal?.toFixed(2)}</span>
        </div>
      );

    case 'barcode': {
      const barcodeValue = el.content && el.content.trim() !== '' ? el.content : sampleData.invoiceNumber || 'INV-100001';
      const barcodeSvgHtml = generateRealBarcodeSvg(barcodeValue, 32);
      return (
        <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
          <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }} />
        </div>
      );
    }

    case 'qr_code': {
      const qrValue = el.content && el.content.trim() !== '' ? el.content : sampleData.invoiceNumber || 'INV-100001';
      const qrUrl = generateRealQrCodeSvg(qrValue);
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img src={qrUrl} alt="Scannable QR Code" className="max-w-full max-h-full object-contain" />
        </div>
      );
    }

    case 'footer_text':
      return (
        <div className="w-full text-[9px] text-slate-700 text-center leading-tight">
          {el.content || 'Thank you for your business!'}
        </div>
      );

    default:
      return <div className="w-full text-[10px]">{el.content || el.label}</div>;
  }
}

function elementBaseStyle(el: PlacedElement, unit: string): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${el.x}${unit}`,
    top: `${el.y}${unit}`,
    width: `${el.width}${unit}`,
    height: `${el.height}${unit}`,
    fontSize: el.style.fontSize ? `${el.style.fontSize}px` : undefined,
    fontWeight: el.style.fontWeight,
    textAlign: el.style.textAlign,
    color: el.style.color ?? '#000000',
    zIndex: el.zIndex,
    boxSizing: 'border-box',
  };
}

export const PrintRenderer: React.FC<PrintRendererProps> = ({
  schema,
  sampleData = DEFAULT_SAMPLE,
  className = '',
  isPrintOnly = false,
  flow = false,
}) => {
  const { page, elements } = schema;
  const { selectedElementId, setSelectedElementId, updateElement, deleteElement } = usePrintDesignerStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ startX: number; startY: number; initialElX: number; initialElY: number } | null>(null);

  const editable = !isPrintOnly && !flow;

  const handleMouseDown = (e: React.MouseEvent, el: PrintElement) => {
    if (!editable) return;
    e.stopPropagation();
    setSelectedElementId(el.id);

    setDraggingId(el.id);
    setDragStart({
      startX: e.clientX,
      startY: e.clientY,
      initialElX: el.x,
      initialElY: el.y,
    });
  };

  useEffect(() => {
    if (!draggingId || !dragStart || !editable || !canvasRef.current) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !dragStart) return;
      const rect = canvasRef.current.getBoundingClientRect();

      const scaleX = rect.width / (page.width || 1);
      const scaleY = rect.height / (page.height || 150);

      const dxPx = e.clientX - dragStart.startX;
      const dyPx = e.clientY - dragStart.startY;

      const dxUnits = Math.round(dxPx / (scaleX || 1));
      const dyUnits = Math.round(dyPx / (scaleY || 1));

      const newX = Math.max(0, dragStart.initialElX + dxUnits);
      const newY = Math.max(0, dragStart.initialElY + dyUnits);

      updateElement(draggingId, { x: newX, y: newY });
    };

    const handleWindowMouseUp = () => {
      setDraggingId(null);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingId, dragStart, editable, page.width, page.height, updateElement]);

  // ---------------- FLOW MODE: auto-grown table + multi-page output ----------------
  if (flow || isPrintOnly) {
    const pages = computePrintPages(schema, sampleData.items?.length || 0);
    const multiPage = pages.length > 1;

    return (
      <div id="printable-thermal-canvas" className={`flex flex-col items-center gap-4 ${className}`}>
        {pages.map((p) => (
          <div key={p.pageIndex} className="relative">
            {multiPage && !isPrintOnly && (
              <div className="absolute -top-5 left-0 text-[9px] font-bold text-slate-400 font-mono print-hide">
                PAGE {p.pageIndex + 1} / {pages.length}
              </div>
            )}
            <div
              className="bg-white text-slate-950 font-mono relative shadow-xl border border-slate-300 overflow-hidden"
              style={{
                width: `${page.width}${page.unit}`,
                minWidth: `${page.width}${page.unit}`,
                height: `${p.heightUnits}${page.unit}`,
                boxSizing: 'border-box',
                pageBreakAfter: p.pageIndex < pages.length - 1 ? 'always' : 'auto',
              }}
            >
              {p.elements.map((el) => (
                <div key={`${el.id}-p${p.pageIndex}`} style={elementBaseStyle(el, page.unit)}>
                  <ElementContent el={el} sampleData={sampleData} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---------------- DESIGN MODE: absolute canvas with drag & drop ----------------
  return (
    <div
      ref={canvasRef}
      id="printable-thermal-canvas"
      onClick={() => setSelectedElementId(null)}
      className={`bg-white text-slate-950 font-mono relative shadow-xl overflow-visible select-none border border-slate-300 ${className}`}
      style={{
        width: `${page.width}${page.unit}`,
        minWidth: `${page.width}${page.unit}`,
        height: `${page.height || 150}${page.unit}`,
        minHeight: page.mode === 'fixed' ? `${page.height}${page.unit}` : '140mm',
        padding: `${page.margins.top}${page.unit} ${page.margins.right}${page.unit} ${page.margins.bottom}${page.unit} ${page.margins.left}${page.unit}`,
        boxSizing: 'border-box',
      }}
    >
      {elements
        .filter((el) => el.enabled)
        .map((el) => {
          const isSelected = selectedElementId === el.id;
          const style: React.CSSProperties = {
            ...elementBaseStyle(el, page.unit),
            zIndex: isSelected ? 999 : el.zIndex,
            cursor: 'grab',
          };

          return (
            <div
              key={el.id}
              style={style}
              onMouseDown={(e) => handleMouseDown(e, el)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElementId(el.id);
              }}
              className={`transition-shadow ${
                isSelected
                  ? 'outline outline-2 outline-brand-500 ring-4 ring-brand-500/30 bg-brand-50/20'
                  : 'hover:outline hover:outline-1 hover:outline-slate-400'
              }`}
            >
              <ElementContent el={el} sampleData={sampleData} />

              {/* Active Selection Handle Bar */}
              {isSelected && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -top-7 left-0 bg-brand-500 text-white text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1.5 shadow-lg pointer-events-auto z-50 selection-badge print-hide"
                >
                  <Move className="w-3 h-3" />
                  <span>X:{el.x} Y:{el.y} W:{el.width} H:{el.height}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(el.id);
                    }}
                    className="ml-1.5 text-white hover:text-red-200 cursor-pointer"
                    title="Delete element"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};
