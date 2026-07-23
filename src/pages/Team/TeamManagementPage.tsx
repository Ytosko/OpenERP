'use client';

import React, { useState } from 'react';
import { ProjectRole } from '@/types/erp';
import { Users, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { useTeamMembers, useInviteMember, useRemoveMember } from '@/hooks/useErpData';
import { useAuthStore } from '@/store/useAuthStore';

export const TeamManagementPage: React.FC = () => {
  const { data: members = [], isLoading, error } = useTeamMembers();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const currentUser = useAuthStore((s) => s.user);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('cashier');
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
      setInviteSuccess(`${inviteEmail} added to the team as ${inviteRole.replace('_', ' ')}.`);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err: any) {
      setActionError(err?.message);
    }
  };

  const handleRemove = async (userId: string) => {
    setActionError(null);
    try {
      await removeMember.mutateAsync(userId);
    } catch (err: any) {
      setActionError(err?.message);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" /> MULTI-USER STORE TEAM & ROLE MANAGEMENT
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Add registered team members by email, assign store roles, and enforce granular access permissions
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg shadow-hacker-orange flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> ADD TEAM MEMBER
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {inviteSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg font-bold">
          {inviteSuccess}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{(error as Error).message}</span>
        </div>
      )}

      {/* Team Members Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">TEAM MEMBER</th>
                <th className="p-3">EMAIL ADDRESS</th>
                <th className="p-3 text-center">ROLE</th>
                <th className="p-3 text-center">STATUS</th>
                <th className="p-3 text-center">JOINED</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">LOADING TEAM FROM DATABASE...</td></tr>
              )}
              {members.map((m) => (
                <tr key={m.user_id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-[10px]">
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>
                      {m.full_name}
                      {m.user_id === currentUser?.id && <span className="text-slate-400 font-normal"> (you)</span>}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{m.email}</td>
                  <td className="p-3 text-center">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-500">{m.joined_at}</td>
                  <td className="p-3 text-center">
                    {m.role !== 'owner' && m.user_id !== currentUser?.id && (
                      <button
                        onClick={() => handleRemove(m.user_id)}
                        disabled={removeMember.isPending}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer disabled:opacity-40"
                        title="Remove team member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">ADD TEAM MEMBER</h3>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500 leading-relaxed">
              The person must already have an account (they can sign up on the login page). Enter the
              email they registered with and pick their role.
            </div>

            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1">REGISTERED EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                  placeholder="jordan@store.com"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">ASSIGN ROLE</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                >
                  <option value="cashier">Cashier (POS Checkout & Receipts)</option>
                  <option value="inventory_manager">Inventory Manager (Stock In/Out & Ledger)</option>
                  <option value="accountant">Accountant (Invoices & Financial Reports)</option>
                  <option value="manager">Store Manager (Full Store Controls)</option>
                  <option value="admin">Admin (Full System & User Management)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded text-slate-700 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={inviteMember.isPending}
                  className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer disabled:opacity-50"
                >
                  {inviteMember.isPending ? 'ADDING...' : 'ADD TO TEAM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
