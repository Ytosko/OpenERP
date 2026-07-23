'use client';

import React from 'react';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { PageUnit, PageMode } from '@/types/print-designer';
import { Eye, EyeOff, MoveUp, MoveDown, Layout, Check, Sliders } from 'lucide-react';

export const EasyModeEditor: React.FC = () => {
  const { schema, toggleElementEnabled, moveElementOrder, setPageSize, updateElement } =
    usePrintDesignerStore();

  const presets = [
    { label: '104mm Industrial Roll', width: 104, height: 160, unit: 'mm' as PageUnit, mode: 'continuous' as PageMode },
    { label: '80mm Thermal Receipt', width: 80, height: 150, unit: 'mm' as PageUnit, mode: 'continuous' as PageMode },
    { label: '58mm Mini Receipt Roll', width: 58, height: 120, unit: 'mm' as PageUnit, mode: 'continuous' as PageMode },
    { label: '4 × 6 Shipping Label', width: 102, height: 152, unit: 'mm' as PageUnit, mode: 'fixed' as PageMode },
    { label: '60 × 40 Barcode Tag', width: 60, height: 40, unit: 'mm' as PageUnit, mode: 'fixed' as PageMode },
    { label: '50 × 30 Price Tag', width: 50, height: 30, unit: 'mm' as PageUnit, mode: 'fixed' as PageMode },
  ];

  // Dynamic sorting by Y coordinate so sidebar matches canvas order 1:1!
  const sortedElements = [...schema.elements].sort((a, b) => a.y - b.y);

  const handleMoveUp = (elId: string) => {
    const idx = sortedElements.findIndex((el) => el.id === elId);
    if (idx <= 0) return;
    const current = sortedElements[idx];
    const prev = sortedElements[idx - 1];

    // Swap Y positions
    const tempY = current.y;
    updateElement(current.id, { y: prev.y });
    updateElement(prev.id, { y: tempY });
  };

  const handleMoveDown = (elId: string) => {
    const idx = sortedElements.findIndex((el) => el.id === elId);
    if (idx === -1 || idx >= sortedElements.length - 1) return;
    const current = sortedElements[idx];
    const next = sortedElements[idx + 1];

    // Swap Y positions
    const tempY = current.y;
    updateElement(current.id, { y: next.y });
    updateElement(next.id, { y: tempY });
  };

  const footerEl = schema.elements.find((el) => el.type === 'footer_text');

  return (
    <div className="space-y-6 text-xs font-mono">
      {/* Direct Paper & Roll Dimensions Editor */}
      <div className="p-3 bg-brand-50 border-2 border-brand-400 rounded-xl space-y-3 shadow-sm">
        <label className="font-bold text-brand-800 flex items-center gap-1.5 uppercase text-xs">
          <Sliders className="w-4 h-4 text-brand-600" /> EDIT EXISTING PAPER / ROLL SIZE
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 block font-bold">WIDTH ({schema.page.unit})</label>
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
              className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block font-bold">HEIGHT ({schema.page.unit})</label>
            <input
              type="number"
              value={schema.page.height}
              onChange={(e) =>
                setPageSize(
                  schema.page.width,
                  parseFloat(e.target.value) || 10,
                  schema.page.unit,
                  schema.page.mode
                )
              }
              className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 block font-bold">UNIT</label>
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
              className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-900"
            >
              <option value="mm">mm (Millimeter)</option>
              <option value="cm">cm (Centimeter)</option>
              <option value="inch">inch (Inch)</option>
              <option value="px">px (Pixels)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block font-bold">MODE</label>
            <select
              value={schema.page.mode}
              onChange={(e) =>
                setPageSize(
                  schema.page.width,
                  schema.page.height,
                  schema.page.unit,
                  e.target.value as PageMode
                )
              }
              className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-900"
            >
              <option value="continuous">Roll / Continuous</option>
              <option value="fixed">Fixed Sheet / Label</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step 1: Page Size Presets */}
      <div>
        <label className="font-bold text-slate-700 block mb-2 tracking-wide uppercase">
          OR QUICK CHOOSE PAPER PRESET
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const isSelected =
              schema.page.width === preset.width &&
              schema.page.unit === preset.unit &&
              schema.page.mode === preset.mode;

            return (
              <button
                key={preset.label}
                onClick={() => setPageSize(preset.width, preset.height, preset.unit, preset.mode)}
                className={`p-2.5 text-left rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Layout className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span className="truncate">{preset.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Toggleable & Reorderable Receipt Blocks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-bold text-slate-700 tracking-wide uppercase">
            CHOOSE BLOCKS & TOP-TO-BOTTOM ORDER
          </label>
        </div>

        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {sortedElements.map((el, idx) => (
            <div
              key={el.id}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                el.enabled
                  ? 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleElementEnabled(el.id)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                >
                  {el.enabled ? (
                    <Eye className="w-3.5 h-3.5 text-brand-500" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <div className="flex flex-col">
                  <span className="font-bold">{el.label}</span>
                  <span className="text-[9px] text-slate-400">Y: {el.y}{schema.page.unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(el.id)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-20 cursor-pointer"
                  title="Move element up"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={idx === sortedElements.length - 1}
                  onClick={() => handleMoveDown(el.id)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-20 cursor-pointer"
                  title="Move element down"
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
        <label className="font-bold text-slate-700 block mb-1 tracking-wide uppercase">
          FOOTER MESSAGE
        </label>
        <textarea
          rows={2}
          value={footerEl?.content || ''}
          onChange={(e) => {
            if (footerEl) updateElement(footerEl.id, { content: e.target.value });
          }}
          className="w-full font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
          placeholder="Thank you for your business!"
        />
      </div>
    </div>
  );
};
