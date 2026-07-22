'use client';

import React from 'react';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { PageUnit, ElementType } from '@/types/print-designer';
import { Trash2, Plus, Sliders, Type, QrCode, Barcode, Image as ImageIcon } from 'lucide-react';

export const AdvancedModeEditor: React.FC = () => {
  const {
    schema,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    addElement,
    deleteElement,
    setPageSize,
    setMargins,
  } = usePrintDesignerStore();

  const selectedEl = schema.elements.find((el) => el.id === selectedElementId);

  return (
    <div className="space-y-5 text-xs font-mono">
      {/* Add New Element Buttons */}
      <div>
        <label className="font-bold text-slate-700 block mb-2 uppercase">ADD ELEMENT TO CANVAS</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => addElement('text', 'Custom Text')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <Type className="w-3.5 h-3.5 text-brand-500" /> Text
          </button>
          <button
            onClick={() => addElement('barcode', 'Barcode Code128')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <Barcode className="w-3.5 h-3.5 text-brand-500" /> Barcode
          </button>
          <button
            onClick={() => addElement('qr_code', 'QR Code')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-500" /> QR Code
          </button>
          <button
            onClick={() => addElement('image', 'Custom Logo / Image')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <ImageIcon className="w-3.5 h-3.5 text-brand-500" /> Image
          </button>
        </div>
      </div>

      {/* Page Dimensions Form */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-brand-500" /> PAGE & UNIT CONFIG
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 block">WIDTH</label>
            <input
              type="number"
              value={schema.page.width}
              onChange={(e) =>
                setPageSize(
                  parseFloat(e.target.value) || 10,
                  schema.page.height,
                  schema.page.unit,
                  schema.page.mode
                )
              }
              className="w-full p-1.5 border border-slate-300 rounded bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block">HEIGHT</label>
            <input
              type="number"
              disabled={schema.page.mode === 'continuous'}
              value={schema.page.height}
              onChange={(e) =>
                setPageSize(
                  schema.page.width,
                  parseFloat(e.target.value) || 10,
                  schema.page.unit,
                  schema.page.mode
                )
              }
              className="w-full p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block">UNIT</label>
            <select
              value={schema.page.unit}
              onChange={(e) =>
                setPageSize(
                  schema.page.width,
                  schema.page.height,
                  e.target.value as PageUnit,
                  schema.page.mode
                )
              }
              className="w-full p-1.5 border border-slate-300 rounded bg-white"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inch">inch</option>
              <option value="px">px</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block">MODE</label>
            <select
              value={schema.page.mode}
              onChange={(e) =>
                setPageSize(
                  schema.page.width,
                  schema.page.height,
                  schema.page.unit,
                  e.target.value as any
                )
              }
              className="w-full p-1.5 border border-slate-300 rounded bg-white"
            >
              <option value="continuous">Roll</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Element Property Editor */}
      {selectedEl ? (
        <div className="p-3 bg-white border border-brand-200 rounded-lg space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-brand-600 truncate">{selectedEl.label} PROPERTIES</span>
            <button
              onClick={() => deleteElement(selectedEl.id)}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block">POS X ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.x}
                onChange={(e) => updateElement(selectedEl.id, { x: parseFloat(e.target.value) || 0 })}
                className="w-full p-1 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">POS Y ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.y}
                onChange={(e) => updateElement(selectedEl.id, { y: parseFloat(e.target.value) || 0 })}
                className="w-full p-1 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">WIDTH ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.width}
                onChange={(e) => updateElement(selectedEl.id, { width: parseFloat(e.target.value) || 1 })}
                className="w-full p-1 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">HEIGHT ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.height}
                onChange={(e) => updateElement(selectedEl.id, { height: parseFloat(e.target.value) || 1 })}
                className="w-full p-1 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block">FONT SIZE (PX)</label>
              <input
                type="number"
                value={selectedEl.style.fontSize || 12}
                onChange={(e) =>
                  updateElement(selectedEl.id, { style: { fontSize: parseInt(e.target.value) || 12 } })
                }
                className="w-full p-1 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">ALIGNMENT</label>
              <select
                value={selectedEl.style.textAlign || 'left'}
                onChange={(e) =>
                  updateElement(selectedEl.id, { style: { textAlign: e.target.value as any } })
                }
                className="w-full p-1 border border-slate-300 rounded"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block">TEXT CONTENT / BINDING</label>
            <input
              type="text"
              value={selectedEl.content || ''}
              onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
              className="w-full p-1.5 border border-slate-300 rounded"
              placeholder="e.g. {{invoice.number}} or Custom Text"
            />
          </div>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-slate-300 rounded-lg text-slate-400 text-center">
          Click an element in the elements list to adjust coordinates & styling.
        </div>
      )}
    </div>
  );
};
