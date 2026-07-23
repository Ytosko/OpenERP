'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import {
  Building2,
  DollarSign,
  Receipt,
  ShieldCheck,
  Upload,
  Check,
  Save,
  Sliders,
  Globe,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activeProject, setActiveProject } = useAuthStore();
  const { uploadLogoImage } = usePrintDesignerStore();

  const [companyName, setCompanyName] = useState(activeProject?.name || 'Hacker Mart Enterprise ERP');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [taxRate, setTaxRate] = useState(8.5);
  const [taxId, setTaxId] = useState('TAX-88912-US');
  const [storeAddress, setStoreAddress] = useState('100 Technology Way, San Francisco, CA');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping! Returns accepted within 14 days with original receipt.');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeProject) {
      setActiveProject({
        ...activeProject,
        name: companyName,
        currency_code: currencySymbol === '$' ? 'USD' : currencySymbol === '€' ? 'EUR' : 'GBP',
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="space-y-6 font-mono text-xs max-w-4xl mx-auto">
      {/* Top Title Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-500" /> STORE BRANDING, SAAS & TAX CONFIGURATION
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            White-label your ERP SaaS product, customize currency symbols, default taxes, and store receipts.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> ENTERPRISE SAAS LICENSE
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Company & Store Identity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2 border-b pb-2">
            <Globe className="w-4 h-4 text-brand-500" /> 1. COMPANY & WHITE-LABEL IDENTITY
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 block mb-1 font-bold">STORE / COMPANY NAME</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1 font-bold">BUSINESS TAX / VAT ID</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-bold">PHYSICAL STORE ADDRESS</label>
            <textarea
              rows={2}
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-bold">COMPANY LOGO FOR RECEIPTS & INVOICES</label>
            <label className="p-3 bg-brand-50 hover:bg-brand-100 border border-brand-300 text-brand-700 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-brand-600" /> UPLOAD NEW BRAND LOGO
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Currency & Tax Rates */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2 border-b pb-2">
            <DollarSign className="w-4 h-4 text-brand-500" /> 2. CURRENCY & DEFAULT TAX CONFIG
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 block mb-1 font-bold">STORE CURRENCY SYMBOL</label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-brand-500 outline-none"
              >
                <option value="$">$ (USD / AUD / CAD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="৳">৳ (BDT)</option>
                <option value="₹">₹ (INR)</option>
                <option value="¥">¥ (JPY / CNY)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1 font-bold">DEFAULT SALES TAX (%)</label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Receipt Terms & Legal */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2 border-b pb-2">
            <Receipt className="w-4 h-4 text-brand-500" /> 3. DEFAULT PRINT RECEIPT TERMS
          </h3>

          <div>
            <label className="text-slate-500 block mb-1 font-bold">FOOTER RETURN POLICY & TERMS</label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Save Button & Feedback */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm animate-bounce">
              <Check className="w-4 h-4" /> STORE SETTINGS SAVED & APPLIED!
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl shadow-hacker-orange flex items-center gap-2 cursor-pointer transition-all text-xs"
          >
            <Save className="w-4 h-4" /> SAVE STORE CONFIGURATION
          </button>
        </div>
      </form>
    </div>
  );
};
