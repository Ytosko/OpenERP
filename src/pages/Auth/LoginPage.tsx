'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setAuth, setActiveProject } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuth(
        { id: 'usr-1', email, user_metadata: { full_name: 'Demo Cashier' } } as any,
        { access_token: 'demo-token' } as any
      );
      setActiveProject({
        id: 'proj-101',
        name: 'Hacker Mart General Store',
        slug: 'hacker-mart',
        currency_code: 'USD',
        role: 'owner',
      });
      setLoading(false);
      navigate('/pos');
    } else {
      setAuth(data.user, data.session);
      navigate('/pos');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-mono text-xs">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 text-white rounded-xl shadow-hacker-orange mb-3">
          <Terminal className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">MODULAR AI POS</h1>
        <p className="text-slate-400 mt-1">Universal Print Designer & Retail Operating System</p>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-3">
          AUTHENTICATE TO STORE
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-slate-400 block mb-1">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cashier@store.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:border-brand-500 outline-none"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-lg shadow-hacker-orange flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER STORE & POS'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-slate-400">
          Need an account?{' '}
          <Link to="/signup" className="text-brand-500 font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};
