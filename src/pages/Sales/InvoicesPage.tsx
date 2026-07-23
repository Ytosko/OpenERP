'use client';

import React, { useState } from 'react';
import { FileText, Printer, Eye, Search, FolderOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { PrintRenderer } from '@/components/print-designer/PrintRenderer';
import { usePosStore, CompletedSaleRecord } from '@/store/usePosStore';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useInvoices } from '@/hooks/useInvoices';

export const InvoicesPage: React.FC = () => {
  const { completedSales: sessionSales } = usePosStore();
  const { activeProject } = useAuthStore();
  const { templates, schema: activePrintTemplate } = usePrintDesignerStore();
  const { data: dbInvoices = [], isLoading, error, refetch, isFetching } = useInvoices();

  const [selectedInvoice, setSelectedInvoice] = useState<CompletedSaleRecord | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(activePrintTemplate.id);
  const [search, setSearch] = useState('');

  // DB is the source of truth; session sales queued offline (not yet in the DB)
  // are shown on top so the cashier can see they exist but are unsynced.
  const offlineQueuedSales = sessionSales.filter((s) => s.status === 'queued_offline');
  const completedSales = [...offlineQueuedSales, ...dbInvoices];

  const filtered = completedSales.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const currentPrintTemplate =
    templates.find((t) => t.id === selectedTemplateId) || activePrintTemplate;

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" /> SALES & COMPLETED INVOICES ({completedSales.length})
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">Immutable audit ledger of all POS transactions and receipts</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 cursor-pointer text-slate-600"
          title="Reload from database"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-400 text-center">
          LOADING INVOICES FROM DATABASE...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{(error as Error).message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by invoice # or customer name..."
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:border-brand-500 outline-none shadow-sm font-bold"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">INVOICE #</th>
                <th className="p-3">CUSTOMER</th>
                <th className="p-3">DATE & TIME</th>
                <th className="p-3 text-center">ITEMS</th>
                <th className="p-3 text-right">TOTAL</th>
                <th className="p-3 text-center">PAYMENT</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3 font-bold text-slate-900">{inv.invoice_number}</td>
                  <td className="p-3">{inv.customer_name}</td>
                  <td className="p-3 text-slate-500 text-[11px]">{inv.date}</td>
                  <td className="p-3 text-center font-semibold">{inv.items_count}</td>
                  <td className="p-3 text-right font-bold text-brand-600">${inv.total_amount.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {inv.payment_method}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 border border-slate-200 rounded hover:border-brand-500 hover:bg-brand-50 text-slate-700 font-bold flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-500" /> REPRINT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail / Reprint Modal with Print Template Switcher */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 w-full text-center">
              REPRINT INVOICE RECEIPT
            </h3>

            {/* Template Selector Dropdown */}
            <div className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase">
                <FolderOpen className="w-3.5 h-3.5 text-brand-500" /> SELECT PRINT DESIGN / TEMPLATE
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:border-brand-500 outline-none text-xs cursor-pointer"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    📄 {t.name} ({t.page.width}{t.page.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Render Real Invoice Data through Selected Custom Print Design */}
            <div className="w-full border-t border-slate-200 pt-3 flex justify-center max-h-[320px] overflow-y-auto">
              <PrintRenderer
                schema={currentPrintTemplate}
                flow
                sampleData={{
                  storeName: activeProject?.name || 'HACKER MART STORE',
                  storeAddress: '100 Technology Way, San Francisco, CA',
                  invoiceNumber: selectedInvoice.invoice_number,
                  dateTime: selectedInvoice.date,
                  cashier: 'Alex Cashier',
                  customerName: selectedInvoice.customer_name,
                  items: [
                    { name: 'Completed POS Order Items', sku: 'ITEM-ALL', qty: selectedInvoice.items_count, price: selectedInvoice.total_amount / Math.max(1, selectedInvoice.items_count), total: selectedInvoice.total_amount },
                  ],
                  subtotal: selectedInvoice.total_amount,
                  discount: 0,
                  tax: 0,
                  grandTotal: selectedInvoice.total_amount,
                }}
              />
            </div>

            <div className="flex gap-2 w-full pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2 border border-slate-300 rounded text-slate-700 font-bold cursor-pointer"
              >
                CLOSE
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> PRINT RECEIPT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
