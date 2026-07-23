'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, AlertCircle } from 'lucide-react';
import { useFinancialReport } from '@/hooks/useErpData';

const PERIODS = [
  { label: 'TODAY', days: 1 },
  { label: '7 DAYS', days: 7 },
  { label: '30 DAYS', days: 30 },
  { label: '90 DAYS', days: 90 },
];

export const ReportsPage: React.FC = () => {
  const [days, setDays] = useState(30);
  const { data: report, isLoading, error } = useFinancialReport(days);

  const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const margin =
    report && report.totalRevenue > 0
      ? ((report.grossProfit / report.totalRevenue) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header & Period Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-500" /> FINANCIAL & ERP REPORTING ANALYTICS
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Live gross profit, sales revenue, cashier performance, and payment method breakdown from your database
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                days === p.days ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-400 text-center">
          CRUNCHING NUMBERS FROM DATABASE...
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{(error as Error).message}</span>
        </div>
      )}

      {report && (
        <>
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
                <span>TOTAL SALES REVENUE</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{fmt(report.totalRevenue)}</div>
              <div className="text-[10px] text-slate-500">Last {days} day{days > 1 ? 's' : ''}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
                <span>GROSS PROFIT</span>
                <TrendingUp className="w-4 h-4 text-brand-500" />
              </div>
              <div className="text-xl font-bold text-brand-600">{fmt(report.grossProfit)}</div>
              <div className="text-[10px] text-slate-500">Margin: {margin}% · COGS {fmt(report.totalCost)}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
                <span>COMPLETED SALES</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{report.invoiceCount} Invoices</div>
              <div className="text-[10px] text-slate-500">Avg ticket: {fmt(report.avgTicket)}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
                <span>LOW STOCK ALERTS</span>
                <Package className="w-4 h-4 text-red-500" />
              </div>
              <div className={`text-xl font-bold ${report.lowStock.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {report.lowStock.length} SKU{report.lowStock.length === 1 ? '' : 's'} Need Reorder
              </div>
              <div className="text-[10px] text-slate-500">At or below their threshold</div>
            </div>
          </div>

          {/* Cashier & Payment Gateway Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales by Cashier */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-xs border-b pb-2 uppercase">SALES BY CASHIER</h3>
              <div className="space-y-2 text-slate-700">
                {report.byCashier.length === 0 && (
                  <div className="p-2 text-slate-400">No sales in this period.</div>
                )}
                {report.byCashier.map((c) => (
                  <div key={c.name} className="flex justify-between p-2 bg-slate-50 rounded font-semibold">
                    <span>{c.name}</span>
                    <span className="font-bold">{fmt(c.total)} ({c.count} sales)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales by Payment Method */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-xs border-b pb-2 uppercase">SALES BY PAYMENT METHOD</h3>
              <div className="space-y-2 text-slate-700">
                {report.byPaymentMethod.length === 0 && (
                  <div className="p-2 text-slate-400">No payments in this period.</div>
                )}
                {report.byPaymentMethod.map((m) => (
                  <div key={m.method} className="flex justify-between p-2 bg-slate-50 rounded font-semibold">
                    <span>{m.method} PAYMENTS</span>
                    <span className="font-bold">{fmt(m.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low Stock Detail */}
          {report.lowStock.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-xs border-b pb-2 uppercase">REORDER RECOMMENDATIONS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {report.lowStock.map((p) => (
                  <div key={p.sku} className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{p.sku}</div>
                    </div>
                    <div className="text-red-700 font-bold text-right">
                      {p.quantity} left
                      <div className="text-[9px] font-normal">threshold {p.threshold}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
