'use client';

import React from 'react';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { PageUnit } from '@/types/print-designer';
import {
  Trash2,
  Sliders,
  Type,
  QrCode,
  Barcode,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdvancedModeEditor: React.FC = () => {
  const {
    schema,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    addElement,
    deleteElement,
    moveElementOrder,
    toggleElementEnabled,
    setPageSize,
  } = usePrintDesignerStore();

  const selectedEl = schema.elements.find((el) => el.id === selectedElementId);

  return (
    <div className="space-y-5 text-xs font-mono">
      {/* Add New Element Buttons */}
      <div>
        <label className="font-bold text-slate-700 block mb-2 uppercase">ADD ELEMENT TO CANVAS</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addElement('text', 'Custom Text')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <Type className="w-3.5 h-3.5 text-brand-500" /> + Text
          </button>
          <button
            onClick={() => addElement('barcode', 'Barcode Code128')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <Barcode className="w-3.5 h-3.5 text-brand-500" /> + Barcode
          </button>
          <button
            onClick={() => addElement('qr_code', 'QR Code')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-500" /> + QR Code
          </button>
          <button
            onClick={() => addElement('image', 'Custom Logo / Image')}
            className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <ImageIcon className="w-3.5 h-3.5 text-brand-500" /> + Image
          </button>
        </div>
      </div>

      {/* Selected Element Property Editor */}
      {selectedEl ? (
        <div className="p-3 bg-white border-2 border-brand-500 rounded-lg space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-brand-600 truncate">{selectedEl.label}</span>
            <button
              onClick={() => deleteElement(selectedEl.id)}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
              title="Delete element"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block">X POSITION ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.x}
                onChange={(e) => updateElement(selectedEl.id, { x: parseFloat(e.target.value) || 0 })}
                className="w-full p-1.5 border border-slate-300 rounded font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">Y POSITION ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.y}
                onChange={(e) => updateElement(selectedEl.id, { y: parseFloat(e.target.value) || 0 })}
                className="w-full p-1.5 border border-slate-300 rounded font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block">WIDTH ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.width}
                onChange={(e) => updateElement(selectedEl.id, { width: parseFloat(e.target.value) || 1 })}
                className="w-full p-1.5 border border-slate-300 rounded font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">HEIGHT ({schema.page.unit})</label>
              <input
                type="number"
                value={selectedEl.height}
                onChange={(e) => updateElement(selectedEl.id, { height: parseFloat(e.target.value) || 1 })}
                className="w-full p-1.5 border border-slate-300 rounded font-bold"
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
                className="w-full p-1.5 border border-slate-300 rounded font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">ALIGNMENT</label>
              <select
                value={selectedEl.style.textAlign || 'left'}
                onChange={(e) =>
                  updateElement(selectedEl.id, { style: { textAlign: e.target.value as any } })
                }
                className="w-full p-1.5 border border-slate-300 rounded font-bold"
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
              className="w-full p-1.5 border border-slate-300 rounded font-bold"
              placeholder="e.g. {{invoice.number}} or Custom Text"
            />
          </div>
        </div>
      ) : (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-brand-700 text-center font-bold">
          Click any item in the canvas or list below to drag & edit.
        </div>
      )}

      {/* Layer Elements List */}
      <div>
        <label className="font-bold text-slate-700 block mb-2 uppercase">CANVAS LAYERS ({schema.elements.length})</label>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {schema.elements.map((el) => (
            <div
              key={el.id}
              onClick={() => setSelectedElementId(el.id)}
              className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-all ${
                selectedElementId === el.id
                  ? 'border-brand-500 bg-brand-50 font-bold'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleElementEnabled(el.id);
                  }}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {el.enabled ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <span className="truncate">{el.label}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveElementOrder(el.id, 'up');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveElementOrder(el.id, 'down');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
