'use client';

import React, { useState } from 'react';
import { TemplateSchema, PrintElement } from '@/types/print-designer';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { Move, Trash2 } from 'lucide-react';

export interface PrintRendererProps {
  schema: TemplateSchema;
  sampleData?: {
    storeName?: string;
    storeAddress?: string;
    invoiceNumber?: string;
    dateTime?: string;
    cashier?: string;
    customerName?: string;
    items?: Array<{ name: string; sku: string; qty: number; price: number; total: number }>;
    subtotal?: number;
    discount?: number;
    tax?: number;
    grandTotal?: number;
  };
  className?: string;
  isPrintOnly?: boolean;
}

export const PrintRenderer: React.FC<PrintRendererProps> = ({
  schema,
  sampleData = {
    storeName: 'HACKER MART STORE',
    storeAddress: '100 Technology Way, San Francisco, CA',
    invoiceNumber: 'INV-20260723-00109',
    dateTime: new Date().toLocaleString(),
    cashier: 'Alex Cashier',
    customerName: 'Walk-in Customer',
    items: [
      { name: 'Double Espresso 12oz', sku: 'COF-101', qty: 2, price: 3.75, total: 7.50 },
      { name: 'Fresh Butter Croissant', sku: 'BAK-201', qty: 1, price: 4.25, total: 4.25 },
      { name: 'Oat Milk Latte 16oz', sku: 'COF-102', qty: 1, price: 5.50, total: 5.50 },
    ],
    subtotal: 17.25,
    discount: 1.00,
    tax: 1.38,
    grandTotal: 17.63,
  },
  className = '',
  isPrintOnly = false,
}) => {
  const { page, elements } = schema;
  const { selectedElementId, setSelectedElementId, updateElement, deleteElement } =
    usePrintDesignerStore();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ startX: number; startY: number; initialElX: number; initialElY: number } | null>(null);

  const getWidthCss = () => {
    switch (page.unit) {
      case 'mm':
        return `${page.width}mm`;
      case 'cm':
        return `${page.width}cm`;
      case 'inch':
        return `${page.width}in`;
      case 'px':
      default:
        return `${page.width}px`;
    }
  };

  const getHeightCss = () => {
    if (page.mode === 'continuous') return 'auto';
    switch (page.unit) {
      case 'mm':
        return `${page.height}mm`;
      case 'cm':
        return `${page.height}cm`;
      case 'inch':
        return `${page.height}in`;
      case 'px':
      default:
        return `${page.height}px`;
    }
  };

  const handleMouseDown = (e: React.MouseEvent, el: PrintElement) => {
    if (isPrintOnly) return;
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !dragStart || isPrintOnly) return;
    const dx = Math.round((e.clientX - dragStart.startX) / 3);
    const dy = Math.round((e.clientY - dragStart.startY) / 3);

    const newX = Math.max(0, dragStart.initialElX + dx);
    const newY = Math.max(0, dragStart.initialElY + dy);

    updateElement(draggingId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setDragStart(null);
  };

  return (
    <div
      id="printable-thermal-canvas"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => !isPrintOnly && setSelectedElementId(null)}
      className={`bg-white text-slate-950 font-mono relative shadow-md overflow-hidden select-none border border-slate-200 ${className}`}
      style={{
        width: getWidthCss(),
        minWidth: getWidthCss(),
        height: getHeightCss(),
        minHeight: page.mode === 'fixed' ? getHeightCss() : '130mm',
        padding: `${page.margins.top}${page.unit} ${page.margins.right}${page.unit} ${page.margins.bottom}${page.unit} ${page.margins.left}${page.unit}`,
        boxSizing: 'border-box',
      }}
    >
      {elements
        .filter((el) => el.enabled)
        .map((el) => {
          const isSelected = !isPrintOnly && selectedElementId === el.id;
          const isAbsolute = page.mode === 'fixed' || (el.x >= 0 && el.y >= 0);

          const style: React.CSSProperties = {
            position: isAbsolute ? 'absolute' : 'relative',
            left: isAbsolute ? `${el.x}${page.unit}` : undefined,
            top: isAbsolute ? `${el.y}${page.unit}` : undefined,
            width: `${el.width}${page.unit}`,
            height: `${el.height}${page.unit}`,
            fontSize: el.style.fontSize ? `${el.style.fontSize}px` : undefined,
            fontWeight: el.style.fontWeight,
            textAlign: el.style.textAlign,
            color: el.style.color ?? '#000000',
            zIndex: el.zIndex,
            boxSizing: 'border-box',
            cursor: !isPrintOnly ? 'move' : 'default',
          };

          const renderContent = () => {
            switch (el.type) {
              case 'logo':
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    {el.content ? (
                      <img src={el.content} alt="Store Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-bold">
                        [LOGO]
                      </div>
                    )}
                  </div>
                );

              case 'store_name':
                return <div className="truncate font-bold">{el.content || sampleData.storeName}</div>;

              case 'store_address':
                return <div className="text-[10px] leading-tight text-slate-700">{el.content || sampleData.storeAddress}</div>;

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
                  <div className="text-[11px] leading-snug">
                    <div><span className="font-bold">INVOICE:</span> {sampleData.invoiceNumber}</div>
                    <div className="text-[9px] text-slate-600">DATE: {sampleData.dateTime}</div>
                  </div>
                );

              case 'product_table':
                return (
                  <div className="w-full text-[10px]">
                    <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1">
                      <span>ITEM</span>
                      <span>QTY</span>
                      <span>TOTAL</span>
                    </div>
                    {sampleData.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between my-0.5">
                        <span className="truncate w-1/2 font-semibold">{item.name}</span>
                        <span className="w-1/6 text-center">{item.qty}</span>
                        <span className="w-1/3 text-right">${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                );

              case 'grand_total':
                return (
                  <div className="w-full text-sm font-bold flex justify-between border-t border-black pt-1">
                    <span>TOTAL:</span>
                    <span>${sampleData.grandTotal?.toFixed(2)}</span>
                  </div>
                );

              case 'barcode':
                return (
                  <div className="text-center w-full">
                    <div className="bg-black text-white text-[8px] tracking-[0.3em] font-bold py-1 px-3 inline-block">
                      ||| | |||| | |||||| ||
                    </div>
                    <div className="text-[9px]">{sampleData.invoiceNumber}</div>
                  </div>
                );

              case 'qr_code':
                return (
                  <div className="text-center w-full flex items-center justify-center">
                    <div className="w-14 h-14 bg-black text-white text-[8px] flex items-center justify-center border border-slate-300">
                      [QR-CODE]
                    </div>
                  </div>
                );

              case 'footer_text':
                return (
                  <div className="text-[9px] text-slate-700 text-center leading-tight">
                    {el.content || 'Thank you for your business!'}
                  </div>
                );

              default:
                return <div className="text-[10px]">{el.content || el.label}</div>;
            }
          };

          return (
            <div
              key={el.id}
              style={style}
              onMouseDown={(e) => handleMouseDown(e, el)}
              className={`transition-shadow ${
                isSelected
                  ? 'outline outline-2 outline-brand-500 ring-4 ring-brand-500/20 bg-brand-50/10 z-50'
                  : 'hover:outline hover:outline-1 hover:outline-slate-400'
              }`}
            >
              {renderContent()}

              {/* Selection overlay handles */}
              {isSelected && (
                <div className="absolute -top-6 left-0 bg-brand-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow pointer-events-auto">
                  <Move className="w-3 h-3" />
                  <span>X:{el.x} Y:{el.y}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(el.id);
                    }}
                    className="ml-1 text-white hover:text-red-200"
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
