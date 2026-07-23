'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Lock, KeyRound, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { loginWithEmployeeCode } = useAuthStore();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = loginWithEmployeeCode(employeeCode, password);

    if (res.success) {
      setLoading(false);
      navigate('/pos');
    } else {
      setLoading(false);
      setErrorMsg(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-mono text-xs">
      {/* System Entrypoint Branding */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 text-white rounded-2xl shadow-hacker-orange mb-3">
          <Terminal className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">MODULAR RETAIL ERP</h1>
        <p className="text-slate-400 mt-1">Employee & Superadmin Gateway Entrypoint</p>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-500" /> STORE EMPLOYEE LOGIN
          </h2>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            SECURE SESSION
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 block mb-1">EMPLOYEE CODE / SUPERADMIN ID</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="e.g. EMP-101 or superadmin"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:border-brand-500 outline-none font-bold uppercase tracking-wider placeholder:normal-case placeholder:font-normal"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-lg shadow-hacker-orange flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {loading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER POS'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1 text-[10px] text-slate-400">
          <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1 uppercase">
            DEMO CREDENTIALS:
          </div>
          <div>🔑 <span className="font-bold text-brand-400">Superadmin:</span> superadmin / admin123</div>
          <div>👤 <span className="font-bold text-brand-400">Cashier:</span> EMP-101 / 1234</div>
          <div>👔 <span className="font-bold text-brand-400">Manager:</span> EMP-102 / 1234</div>
        </div>
      </div>
    </div>
  );
};
