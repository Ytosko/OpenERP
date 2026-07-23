'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Store, Printer, ArrowRight, Check, AlertCircle, PackagePlus } from 'lucide-react';

export const GuidedSetupPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [currency, setCurrency] = useState('USD');
  const [loadDemoCatalog, setLoadDemoCatalog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { refreshProjects, selectProject } = useAuthStore();

  const handleCompleteSetup = async () => {
    if (!storeName.trim()) {
      setErrorMsg('Please enter a store name in step 1.');
      setStep(1);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc('create_project_with_defaults', {
        p_name: storeName.trim(),
        p_business_type: businessType,
        p_currency: currency,
      });

      if (error) {
        throw new Error(error.message);
      }

      const projectId = data?.project_id as string;
      const storeId = data?.store_id as string;

      if (loadDemoCatalog && projectId && storeId) {
        const { error: seedError } = await supabase.rpc('seed_demo_catalog', {
          p_project_id: projectId,
          p_store_id: storeId,
        });
        if (seedError) {
          // Project exists; catalog seed failing is recoverable — surface it,
          // but do not abandon the newly created store.
          console.error('Demo catalog seed failed:', seedError.message);
        }
      }

      await refreshProjects();
      if (projectId) {
        await selectProject(projectId);
      }
      navigate('/pos');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Store creation failed. Check that database migrations are applied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl font-mono text-xs">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center font-bold">
              {step}
            </div>
            <div>
              <div className="text-white font-bold uppercase">STORE ONBOARDING</div>
              <div className="text-[10px] text-slate-400">Step {step} of 3</div>
            </div>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full ${
                  i <= step ? 'bg-brand-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-500" /> WHAT DO YOU SELL?
            </h3>

            <div>
              <label className="text-slate-400 block mb-1">STORE / BUSINESS NAME</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Apex Health Pharmacy or Artisanal Roasters"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">BUSINESS TYPE</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-brand-500 outline-none"
                >
                  <option value="retail">General Retail</option>
                  <option value="coffee_shop">Coffee & Bakery</option>
                  <option value="pharmacy">Pharmacy & Health</option>
                  <option value="restaurant">Restaurant & Food</option>
                  <option value="electronics">Electronics</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CURRENCY</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-brand-500 outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-lg shadow-hacker-orange flex items-center justify-center gap-2 cursor-pointer"
            >
              NEXT STEP <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Receipt Preset */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Printer className="w-4 h-4 text-brand-500" /> CHOOSE A RECEIPT SIZE
            </h3>

            <div className="space-y-2">
              {[
                { name: '80mm Thermal Roll (3")', desc: 'Standard POS receipt printer' },
                { name: '58mm Compact Roll (2")', desc: 'Mobile or small thermal receipt' },
                { name: '4 × 6 Shipping Label', desc: 'Logistics and package labels' },
              ].map((rec) => (
                <div
                  key={rec.name}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-white"
                >
                  <div>
                    <div className="font-bold">{rec.name}</div>
                    <div className="text-[10px] text-slate-400">{rec.desc}</div>
                  </div>
                  <Check className="w-4 h-4 text-brand-500" />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-slate-800 text-slate-300 rounded-lg cursor-pointer"
              >
                BACK
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-lg shadow-hacker-orange cursor-pointer"
              >
                NEXT STEP <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Catalog & Launch */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-brand-500" /> STARTING CATALOG
            </h3>

            <label className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-white">
              <input
                type="checkbox"
                checked={loadDemoCatalog}
                onChange={(e) => setLoadDemoCatalog(e.target.checked)}
                className="mt-0.5 accent-orange-500"
              />
              <span>
                <span className="font-bold block">Load demo catalog (12 products)</span>
                <span className="text-[10px] text-slate-400">
                  Coffee, bakery, electronics & supplies with opening stock — the fastest way to try
                  the POS. You can delete them anytime.
                </span>
              </span>
            </label>

            <button
              onClick={handleCompleteSetup}
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-lg shadow-hacker-orange flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'CREATING YOUR STORE IN SUPABASE...' : 'LAUNCH STORE & POS'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
