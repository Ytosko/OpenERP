'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { isSupabaseConfigured } from '@/lib/supabase';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { loginWithEmail } = useAuthStore();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await loginWithEmail(email, password);
    setLoading(false);

    if (res.success) {
      navigate(res.hasProject ? '/pos' : '/onboarding');
    } else {
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
        <p className="text-slate-400 mt-1">Secure Store Sign-In</p>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-500" /> STORE LOGIN
          </h2>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            SUPABASE AUTH
          </span>
        </div>

        {!isSupabaseConfigured() && (
          <div className="p-3 bg-amber-950/80 border border-amber-800 text-amber-300 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">
              Backend not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file,
              then restart the dev server.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 block mb-1">EMAIL</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourstore.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:border-brand-500 outline-none"
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
                autoComplete="current-password"
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
            {loading ? 'VERIFYING CREDENTIALS...' : 'SIGN IN & ENTER POS'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-slate-400">
          New store?{' '}
          <Link to="/signup" className="text-brand-500 font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
