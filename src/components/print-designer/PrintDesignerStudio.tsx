'use client';

import React, { useState } from 'react';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { EasyModeEditor } from './EasyModeEditor';
import { AdvancedModeEditor } from './AdvancedModeEditor';
import { PrintRenderer } from './PrintRenderer';
import { optimizeThermalPaperSaver } from '@/lib/ai-forecast';
import { PageMode, PageUnit } from '@/types/print-designer';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Printer,
  Sparkles,
  Sliders,
  Layers,
  Copy,
  Upload,
  Trash2,
  FilePlus,
  FolderOpen,
  Maximize2,
} from 'lucide-react';

export const PrintDesignerStudio: React.FC = () => {
  const {
    mode,
    setMode,
    templates,
    schema,
    setSchema,
    selectTemplate,
    createNewTemplate,
    duplicateTemplate,
    deleteTemplate,
    uploadLogoImage,
    setPageSize,
    undo,
    redo,
    historyIndex,
    history,
  } = usePrintDesignerStore();

  const [zoomLevel, setZoomLevel] = useState(100);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplType, setNewTmplType] = useState<string>('rongta_rp400');
  
  // Custom Roll/Label State for Modal
  const [customWidth, setCustomWidth] = useState<number>(104);
  const [customHeight, setCustomHeight] = useState<number>(160);
  const [customUnit, setCustomUnit] = useState<PageUnit>('mm');
  const [customMode, setCustomMode] = useState<PageMode>('continuous');

  const handleApplyAiPaperSaver = () => {
    const optimized = optimizeThermalPaperSaver(schema);
    setSchema(optimized);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          uploadLogoImage(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTmplType === 'custom') {
      createNewTemplate(newTmplName || 'Custom Label Template', 'custom', {
        width: customWidth,
        height: customHeight,
        unit: customUnit,
        mode: customMode,
      });
    } else {
      createNewTemplate(newTmplName, newTmplType);
    }
    setShowNewModal(false);
    setNewTmplName('');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col font-mono text-xs bg-slate-100 overflow-hidden">
      {/* Top Designer Toolbar */}
      <header className="bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        {/* Left Studio Title & Template Selector */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold shadow-hacker-orange">
            <Printer className="w-4 h-4" />
          </div>

          {/* Template Selector Dropdown */}
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <select
              value={schema.id}
              onChange={(e) => selectTemplate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-white focus:border-brand-500 outline-none cursor-pointer text-xs"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Template Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold flex items-center gap-1 cursor-pointer"
              title="Create new custom print template"
            >
              <FilePlus className="w-3.5 h-3.5 text-brand-500" /> NEW
            </button>

            <button
              onClick={duplicateTemplate}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold flex items-center gap-1 cursor-pointer"
              title="Duplicate current template"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" /> DUP
            </button>

            {templates.length > 1 && (
              <button
                onClick={() => deleteTemplate(schema.id)}
                className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                title="Delete template"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload Logo File Input */}
          <label className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold flex items-center gap-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-400" /> LOGO
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Mode Switcher Pills */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setMode('easy')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === 'easy'
                  ? 'bg-brand-500 text-white shadow-hacker-orange'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> EASY
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === 'advanced'
                  ? 'bg-brand-500 text-white shadow-hacker-orange'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> CANVA
            </button>
          </div>
        </div>

        {/* Center AI Paper Saver Button */}
        <button
          onClick={handleApplyAiPaperSaver}
          className="bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          title="Optimize margins & font spacing to save 30% thermal paper roll"
        >
          <Sparkles className="w-4 h-4 text-brand-500" /> AI 30% PAPER SAVER
        </button>

        {/* Right Tools (Undo, Redo, Zoom, Save) */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-slate-400">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="ml-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-hacker-orange flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> TEST PRINT
          </button>
        </div>
      </header>

      {/* Quick Live Page Dimensions Control Bar */}
      <div className="bg-slate-800 text-slate-200 px-4 py-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-white uppercase text-[11px]">CANVAS SIZE & ROLL RESIZER:</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">WIDTH:</span>
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
              className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center font-bold text-white"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">HEIGHT:</span>
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
              className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center font-bold text-white"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">UNIT:</span>
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
              className="p-1 bg-slate-900 border border-slate-700 rounded font-bold text-white"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inch">inch</option>
              <option value="px">px</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">MODE:</span>
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
              className="p-1 bg-slate-900 border border-slate-700 rounded font-bold text-white"
            >
              <option value="continuous">Roll / Continuous</option>
              <option value="fixed">Fixed Label / Sheet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Workspace (Editor Panel Left, Live Preview Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls Editor Panel */}
        <div className="w-full md:w-96 bg-white border-r border-slate-200 overflow-y-auto p-4 shrink-0 shadow-sm">
          {mode === 'easy' ? <EasyModeEditor /> : <AdvancedModeEditor />}
        </div>

        {/* Right Live Canvas Workstation */}
        <div className="flex-1 bg-slate-200/80 p-6 overflow-auto flex items-center justify-center">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            className="transition-all shadow-2xl bg-white rounded border border-slate-300 p-2"
          >
            <PrintRenderer schema={schema} />
          </div>
        </div>
      </div>

      {/* Modal: Create New Print Template with Custom Sizes & Printer Options */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-mono text-xs text-slate-900">
            <h3 className="text-sm font-bold border-b pb-2 text-brand-600">CREATE NEW PRINT TEMPLATE</h3>

            <form onSubmit={handleCreateNewSubmit} className="space-y-4">
              <div>
                <label className="text-slate-500 block mb-1 font-bold">TEMPLATE NAME</label>
                <input
                  type="text"
                  required
                  value={newTmplName}
                  onChange={(e) => setNewTmplName(e.target.value)}
                  placeholder="e.g. Rongta RP400 Shipping Label"
                  className="w-full p-2.5 border border-slate-300 rounded font-bold outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-bold">LAYOUT / PRINTER PRESET</label>
                <select
                  value={newTmplType}
                  onChange={(e) => setNewTmplType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded font-bold outline-none focus:border-brand-500"
                >
                  <option value="rongta_rp400">🖨️ Rongta RP400 (104mm / 4" Industrial Roll)</option>
                  <option value="rongta_rp500">🖨️ Rongta RP500 (80mm / 104mm Heavy-Duty Thermal)</option>
                  <option value="4x6">📦 102mm x 152mm (4x6 Inch Shipping Label)</option>
                  <option value="80mm">🧾 80mm Continuous Thermal Receipt</option>
                  <option value="58mm">🧾 58mm Mini Thermal Receipt</option>
                  <option value="60x40">🏷️ 60mm x 40mm Product Barcode Tag</option>
                  <option value="50x30">🏷️ 50mm x 30mm Retail Price Tag</option>
                  <option value="custom">⚙️ CUSTOM DIMENSIONS & ROLL SIZE</option>
                </select>
              </div>

              {/* Custom Size Config Input Fields */}
              {newTmplType === 'custom' && (
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg space-y-3">
                  <div className="font-bold text-brand-800">CUSTOM PAGE / ROLL SPECIFICATIONS</div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block">WIDTH</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 10)}
                        className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">HEIGHT</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 10)}
                        className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block">MEASUREMENT UNIT</label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value as PageUnit)}
                        className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                      >
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="inch">inch</option>
                        <option value="px">px</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">ROLL / SHEET MODE</label>
                      <select
                        value={customMode}
                        onChange={(e) => setCustomMode(e.target.value as PageMode)}
                        className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                      >
                        <option value="continuous">Roll / Continuous</option>
                        <option value="fixed">Fixed Sheet / Tag</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded text-slate-700 cursor-pointer font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer"
                >
                  CREATE TEMPLATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
