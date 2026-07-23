'use client';

import React, { useState } from 'react';
import { SUPPORTED_CURRENCIES, CurrencyConfig } from '@/types/erp';
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, ArrowUpRight } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyConfig>(SUPPORTED_CURRENCIES[0]);

  const rawSalesUsd = 12480.50;
  const rawCostUsd = 4920.00;
  const grossProfitUsd = rawSalesUsd - rawCostUsd;

  const formatMoney = (amountUsd: number) => {
    const converted = amountUsd * selectedCurrency.rateToUsd;
    return `${selectedCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header & Multi-Currency Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-500" /> FINANCIAL & ERP REPORTING ANALYTICS
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Real-time gross profit, sales revenue, cashier performance, and multi-currency reporting
          </p>
        </div>

        {/* Multi-Currency Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-bold text-[10px]">DISPLAY CURRENCY:</label>
          <select
            value={selectedCurrency.code}
            onChange={(e) => {
              const found = SUPPORTED_CURRENCIES.find((c) => c.code === e.target.value);
              if (found) setSelectedCurrency(found);
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 focus:border-brand-500 outline-none cursor-pointer"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol}) - {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
            <span>TOTAL SALES REVENUE</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{formatMoney(rawSalesUsd)}</div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +14.2% vs last week
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
            <span>ESTIMATED GROSS PROFIT</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-xl font-bold text-brand-600">{formatMoney(grossProfitUsd)}</div>
          <div className="text-[10px] text-slate-500">Margin: 60.5%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
            <span>TOTAL COMPLETED SALES</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">412 Invoices</div>
          <div className="text-[10px] text-slate-500">Avg ticket: {formatMoney(rawSalesUsd / 412)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-[10px] font-bold uppercase flex justify-between items-center">
            <span>LOW STOCK ALERTS</span>
            <Package className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-600">3 SKUs Need Reorder</div>
          <div className="text-[10px] text-slate-500">Threshold ≤ 5 items</div>
        </div>
      </div>

      {/* Cashier & Payment Gateway Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales by Cashier */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-xs border-b pb-2 uppercase">SALES BY CASHIER</h3>
          <div className="space-y-2 text-slate-700">
            <div className="flex justify-between p-2 bg-slate-50 rounded font-semibold">
              <span>Alex Cashier</span>
              <span className="font-bold">{formatMoney(7240.00)} (210 sales)</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded font-semibold">
              <span>Sam Cashier</span>
              <span className="font-bold">{formatMoney(5240.50)} (202 sales)</span>
            </div>
          </div>
        </div>

        {/* Sales by Payment Method */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-xs border-b pb-2 uppercase">SALES BY PAYMENT METHOD</h3>
          <div className="space-y-2 text-slate-700">
            <div className="flex justify-between p-2 bg-slate-50 rounded font-semibold">
              <span>CASH PAYMENTS</span>
              <span className="font-bold">{formatMoney(6100.00)}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded font-semibold">
              <span>CARD TERMINAL</span>
              <span className="font-bold">{formatMoney(4820.50)}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded font-semibold">
              <span>MOBILE QR PAY</span>
              <span className="font-bold">{formatMoney(1560.00)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
