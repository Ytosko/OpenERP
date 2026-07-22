'use client';

import React from 'react';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { PageUnit, PageMode } from '@/types/print-designer';
import { Eye, EyeOff, MoveUp, MoveDown, Layout, Plus, Check } from 'lucide-react';

export const EasyModeEditor: React.FC = () => {
  const { schema, toggleElementEnabled, moveElementOrder, setPageSize, updateElement, addElement } =
    usePrintDesignerStore();

  const presets = [
    { label: '80mm Roll (3")', width: 80, height: 150, unit: 'mm' as PageUnit, mode: 'continuous' as PageMode },
    { label: '58mm Roll (2")', width: 58, height: 120, unit: 'mm' as PageUnit, mode: 'continuous' as PageMode },
    { label: '4 × 6 Shipping Label', width: 4, height: 6, unit: 'inch' as PageUnit, mode: 'fixed' as PageMode },
    { label: 'A4 Standard Invoice', width: 210, height: 297, unit: 'mm' as PageUnit, mode: 'fixed' as PageMode },
    { label: 'Shelf Barcode Tag', width: 50, height: 30, unit: 'mm' as PageUnit, mode: 'fixed' as PageMode },
  ];

  const footerEl = schema.elements.find((el) => el.type === 'footer_text');

  return (
    <div className="space-y-6">
      {/* Step 1: Page Size Presets */}
      <div>
        <label className="text-xs font-mono font-bold text-slate-700 block mb-2 tracking-wide uppercase">
          1. CHOOSE WHAT YOU ARE PRINTING
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presets.map((preset) => {
            const isSelected =
              schema.page.width === preset.width &&
              schema.page.unit === preset.unit &&
              schema.page.mode === preset.mode;

            return (
              <button
                key={preset.label}
                onClick={() => setPageSize(preset.width, preset.height, preset.unit, preset.mode)}
                className={`p-3 text-left rounded-lg border text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/80 text-brand-600 font-bold shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{preset.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-brand-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Toggleable Receipt Blocks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-bold text-slate-700 tracking-wide uppercase">
            2. CHOOSE BLOCKS TO INCLUDE
          </label>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {schema.elements.map((el, idx) => (
            <div
              key={el.id}
              className={`flex items-center justify-between p-3 rounded-lg border text-xs font-mono transition-all ${
                el.enabled
                  ? 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleElementEnabled(el.id)}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                >
                  {el.enabled ? (
                    <Eye className="w-4 h-4 text-brand-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <span className="font-semibold">{el.label}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => moveElementOrder(el.id, 'up')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-20 cursor-pointer"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={idx === schema.elements.length - 1}
                  onClick={() => moveElementOrder(el.id, 'down')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-20 cursor-pointer"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3: Receipt Footer Text */}
      <div>
        <label className="text-xs font-mono font-bold text-slate-700 block mb-1 tracking-wide uppercase">
          3. RECEIPT FOOTER MESSAGE
        </label>
        <textarea
          rows={2}
          value={footerEl?.content || ''}
          onChange={(e) => {
            if (footerEl) updateElement(footerEl.id, { content: e.target.value });
          }}
          className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
          placeholder="Thank you for your business! Please keep receipt for returns."
        />
      </div>
    </div>
  );
};
