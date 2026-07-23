'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { useProjectRecord, useUpdateProject, uploadStoreLogo } from '@/hooks/useErpData';
import {
  Building2,
  DollarSign,
  Receipt,
  Upload,
  Check,
  Save,
  Globe,
  AlertCircle,
} from 'lucide-react';

const SYMBOL_TO_CODE: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '৳': 'BDT',
  '₹': 'INR',
  '¥': 'JPY',
};

export const SettingsPage: React.FC = () => {
  const activeProject = useAuthStore((s) => s.activeProject);
  const { uploadLogoImage } = usePrintDesignerStore();
  const { data: project, isLoading, error } = useProjectRecord();
  const updateProject = useUpdateProject();

  const [companyName, setCompanyName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [taxRate, setTaxRate] = useState(0);
  const [taxId, setTaxId] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Hydrate the form from the real project record
  useEffect(() => {
    if (!project) return;
    setCompanyName(project.name);
    setCurrencySymbol(project.settings.currency_symbol || '$');
    setTaxRate(project.settings.tax_rate ?? 0);
    setTaxId(project.settings.tax_id || '');
    setStoreAddress(project.settings.address || '');
    setStorePhone(project.settings.phone || '');
    setReceiptFooter(project.settings.receipt_footer || '');
    setLogoUrl(project.logo_url);
  }, [project]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setActionError(null);

    try {
      await updateProject.mutateAsync({
        name: companyName,
        currency_code: SYMBOL_TO_CODE[currencySymbol] || project.currency_code,
        settings: {
          ...project.settings,
          currency_symbol: currencySymbol,
          tax_rate: taxRate,
          tax_id: taxId,
          address: storeAddress,
          phone: storePhone,
          receipt_footer: receiptFooter,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err?.message);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject?.id) return;
    setActionError(null);
    setUploadingLogo(true);

    try {
      // Upload to the store-assets Supabase bucket and persist the public URL
      const publicUrl = await uploadStoreLogo(activeProject.id, file);
      await updateProject.mutateAsync({ logo_url: publicUrl });
      setLogoUrl(publicUrl);
      // Also feed the print-designer preview so receipts render the new logo
      uploadLogoImage(publicUrl);
    } catch (err: any) {
      setActionError(err?.message);
    } finally {
      setUploadingLogo(false);
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
            White-label your store, upload your logo, and configure currency, taxes, and receipt terms.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-400 text-center">
          LOADING STORE CONFIGURATION...
        </div>
      )}

      {(error || actionError) && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError || (error as Error)?.message}</span>
        </div>
      )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-slate-500 block mb-1 font-bold">STORE PHONE</label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-brand-500 outline-none"
                placeholder="+1 (555) 019-2834"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-500 block mb-1 font-bold">COMPANY LOGO FOR RECEIPTS & INVOICES</label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Store logo"
                  className="w-16 h-16 object-contain border border-slate-200 rounded-lg bg-slate-50 p-1"
                />
              )}
              <label className="flex-1 p-3 bg-brand-50 hover:bg-brand-100 border border-brand-300 text-brand-700 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-brand-600" />
                {uploadingLogo ? 'UPLOADING TO SUPABASE STORAGE...' : 'UPLOAD NEW BRAND LOGO'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
              </label>
            </div>
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
              <label className="text-slate-500 block mb-1 font-bold">VAT / SALES TAX (%) — e.g. Bangladesh 15</label>
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
              placeholder="Thank you for shopping! Returns accepted within 14 days with original receipt."
            />
          </div>
        </div>

        {/* Save Button & Feedback */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm">
              <Check className="w-4 h-4" /> SAVED TO SUPABASE — APPLIED EVERYWHERE!
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={updateProject.isPending || isLoading}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl shadow-hacker-orange flex items-center gap-2 cursor-pointer transition-all text-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {updateProject.isPending ? 'SAVING...' : 'SAVE STORE CONFIGURATION'}
          </button>
        </div>
      </form>
    </div>
  );
};
