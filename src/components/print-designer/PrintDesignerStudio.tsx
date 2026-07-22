'use client';

import React, { useState } from 'react';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { EasyModeEditor } from './EasyModeEditor';
import { AdvancedModeEditor } from './AdvancedModeEditor';
import { PrintRenderer } from './PrintRenderer';
import { Printer, Save, Undo, Redo, Sparkles, SlidersHorizontal, Layers, CheckCircle } from 'lucide-react';
import { generateStoreConfigWithGemini } from '@/lib/gemini';

export const PrintDesignerStudio: React.FC = () => {
  const { mode, setMode, schema, undo, redo, saveTemplate, saving, lastSavedAt } =
    usePrintDesignerStore();

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleAiCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    // Call AI helper for layout modifications
    try {
      await generateStoreConfigWithGemini(aiPrompt);
      setAiPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Studio Header Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 text-white rounded-lg flex items-center justify-center shadow-hacker-orange">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-slate-900 uppercase tracking-tight">
              UNIVERSAL PRINT DESIGNER
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Designed for simple drag-and-drop thermal receipts, labels, & invoices
            </p>
          </div>
        </div>

        {/* Mode Selector & Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center font-mono text-xs">
            <button
              onClick={() => setMode('easy')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                mode === 'easy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Easy Mode
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === 'advanced' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Advanced Mode
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
              title="Undo action"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
              title="Redo action"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Test Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-brand-500" />
            PRINT TEST
          </button>

          {/* Save Config */}
          <button
            onClick={saveTemplate}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg shadow-hacker-orange transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING...' : 'SAVE TEMPLATE'}
          </button>
        </div>
      </div>

      {/* Gemini AI Plain Language Command Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg text-white font-mono text-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-brand-500 font-bold shrink-0">
          <Sparkles className="w-4 h-4" />
          <span>AI DESIGN ASSISTANT:</span>
        </div>

        <form onSubmit={handleAiCommand} className="flex-1 flex gap-2 w-full">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder='Try: "Make the total bigger", "Add QR code to bottom", "Change to 4x6 label"'
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            {aiLoading ? 'APPLYING...' : 'APPLY AI'}
          </button>
        </form>

        {lastSavedAt && (
          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Saved {lastSavedAt}
          </span>
        )}
      </div>

      {/* Main Studio Workspace Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          {mode === 'easy' ? <EasyModeEditor /> : <AdvancedModeEditor />}
        </div>

        {/* Visual Live Thermal Canvas (5 cols) */}
        <div className="lg:col-span-5 bg-slate-100 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-start min-h-[500px]">
          <div className="text-xs font-mono font-bold text-slate-500 mb-4 tracking-wider uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            LIVE PRINT CANVAS ({schema.page.width}
            {schema.page.unit} - {schema.page.mode})
          </div>
          <PrintRenderer schema={schema} />
        </div>
      </div>
    </div>
  );
};
