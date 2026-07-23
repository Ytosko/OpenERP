'use client';

import React, { useState } from 'react';
import { PaymentGatewayConfig } from '@/types/erp';
import { CreditCard, Banknote, QrCode, Key, Check, Plus, Settings, ShieldCheck } from 'lucide-react';

const INITIAL_GATEWAYS: PaymentGatewayConfig[] = [
  { id: 'gw-1', name: 'Cash Register Payment', provider: 'cash', enabled: true, instructions: 'Accept physical currency, count change due.' },
  { id: 'gw-2', name: 'Physical Card Terminal (POS)', provider: 'card_terminal', enabled: true, merchantId: 'TERM-8849', instructions: 'Tap or chip insert card on counter reader.' },
  { id: 'gw-3', name: 'Stripe Online & Terminal API', provider: 'stripe', enabled: false, apiKey: 'pk_live_••••••••••••••••', merchantId: 'acct_192847129' },
  { id: 'gw-4', name: 'Square Terminal Integration', provider: 'square', enabled: false, apiKey: 'sq0idp-••••••••••••••••' },
  { id: 'gw-5', name: 'Mobile QR Pay (BKash / Nagad / UPI)', provider: 'qr_mobile', enabled: true, merchantId: '+1 (800) 555-0199', instructions: 'Scan merchant QR code on counter.' },
];

export const PaymentGatewaysPage: React.FC = () => {
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>(INITIAL_GATEWAYS);
  const [selectedGw, setSelectedGw] = useState<PaymentGatewayConfig | null>(null);

  const toggleGateway = (id: string) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g))
    );
  };

  const updateGatewayKeys = (id: string, apiKey: string, merchantId: string, instructions: string) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, apiKey, merchantId, instructions } : g))
    );
    setSelectedGw(null);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-500" /> PAYMENT PROCESSOR & GATEWAY CONFIGURATION
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Configure payment gateways, card terminal APIs, mobile QR payment, and merchant keys
          </p>
        </div>
      </div>

      {/* Payment Processors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((gw) => (
          <div
            key={gw.id}
            className={`p-4 rounded-xl border transition-all bg-white flex flex-col justify-between space-y-4 ${
              gw.enabled ? 'border-slate-300 shadow-sm' : 'border-slate-200 opacity-65'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  {gw.provider === 'cash' && <Banknote className="w-5 h-5" />}
                  {gw.provider === 'card_terminal' && <CreditCard className="w-5 h-5" />}
                  {gw.provider === 'stripe' && <ShieldCheck className="w-5 h-5" />}
                  {gw.provider === 'square' && <Settings className="w-5 h-5" />}
                  {gw.provider === 'qr_mobile' && <QrCode className="w-5 h-5" />}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{gw.name}</h4>
                  <div className="text-[10px] text-slate-400 capitalize">Provider: {gw.provider.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Enable / Disable Toggle */}
              <button
                onClick={() => toggleGateway(gw.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                  gw.enabled
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {gw.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Config Details */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[10px] text-slate-600">
              {gw.merchantId && <div><span className="font-bold text-slate-800">MERCHANT ID:</span> {gw.merchantId}</div>}
              {gw.apiKey && <div><span className="font-bold text-slate-800">API KEY:</span> {gw.apiKey}</div>}
              {gw.instructions && <div><span className="font-bold text-slate-800">INSTRUCTIONS:</span> {gw.instructions}</div>}
            </div>

            <button
              onClick={() => setSelectedGw(gw)}
              className="w-full py-2 border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-brand-500" /> CONFIGURE KEYS & INSTRUCTIONS
            </button>
          </div>
        ))}
      </div>

      {/* Configure Modal */}
      {selectedGw && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase">
              EDIT {selectedGw.name}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const apiKey = (form.elements.namedItem('apiKey') as HTMLInputElement)?.value || '';
                const merchantId = (form.elements.namedItem('merchantId') as HTMLInputElement)?.value || '';
                const instructions = (form.elements.namedItem('instructions') as HTMLTextAreaElement)?.value || '';
                updateGatewayKeys(selectedGw.id, apiKey, merchantId, instructions);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-slate-500 block mb-1">MERCHANT / ACCOUNT ID</label>
                <input
                  type="text"
                  name="merchantId"
                  defaultValue={selectedGw.merchantId || ''}
                  placeholder="e.g. acct_129837129 or +15550199"
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">SECRET API KEY</label>
                <input
                  type="password"
                  name="apiKey"
                  defaultValue={selectedGw.apiKey || ''}
                  placeholder="sk_live_••••••••••••••••"
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">CASHIER CHECKOUT INSTRUCTIONS</label>
                <textarea
                  name="instructions"
                  rows={2}
                  defaultValue={selectedGw.instructions || ''}
                  placeholder="Instructions displayed to cashier during payment..."
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGw(null)}
                  className="flex-1 py-2 border border-slate-300 rounded text-slate-700 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer"
                >
                  SAVE GATEWAY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
