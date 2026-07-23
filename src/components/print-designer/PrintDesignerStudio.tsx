'use client';

import React, { useState } from 'react';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { EasyModeEditor } from './EasyModeEditor';
import { AdvancedModeEditor } from './AdvancedModeEditor';
import { PrintRenderer } from './PrintRenderer';
import { optimizeThermalPaperSaver } from '@/lib/ai-forecast';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Printer,
  Sparkles,
  Sliders,
  Layers,
} from 'lucide-react';

export const PrintDesignerStudio: React.FC = () => {
  const {
    mode,
    setMode,
    schema,
    setSchema,
    undo,
    redo,
    historyIndex,
    history,
  } = usePrintDesignerStore();

  const [zoomLevel, setZoomLevel] = useState(100);

  const handleApplyAiPaperSaver = () => {
    const optimized = optimizeThermalPaperSaver(schema);
    setSchema(optimized);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col font-mono text-xs bg-slate-100 overflow-hidden">
      {/* Top Designer Toolbar */}
      <header className="bg-slate-900 text-white p-3 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-md">
        {/* Left Studio Title & Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold shadow-hacker-orange">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold tracking-wide text-xs">UNIVERSAL PRINT DESIGNER STUDIO</h2>
            <div className="text-[10px] text-slate-400">Canva-grade Thermal & Label Layout Engine</div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="ml-4 bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setMode('easy')}
              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === 'easy'
                  ? 'bg-brand-500 text-white shadow-hacker-orange'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> EASY MODE
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mode === 'advanced'
                  ? 'bg-brand-500 text-white shadow-hacker-orange'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> ADVANCED CANVA
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

      {/* Main Workspace (Editor Panel Left, Live Preview Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls Editor Panel */}
        <div className="w-full md:w-96 bg-white border-r border-slate-200 overflow-y-auto p-4 shrink-0 shadow-sm">
          {mode === 'easy' ? <EasyModeEditor /> : <AdvancedModeEditor />}
        </div>

        {/* Right Live Canvas Canvas Workstation */}
        <div className="flex-1 bg-slate-200/80 p-6 overflow-auto flex items-center justify-center">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            className="transition-all shadow-2xl bg-white rounded border border-slate-300 p-2"
          >
            <PrintRenderer schema={schema} />
          </div>
        </div>
      </div>
    </div>
  );
};
