'use client';

import React, { useState } from 'react';
import { TeamMember, ProjectRole } from '@/types/erp';
import { Users, UserPlus, Shield, Mail, Trash2, CheckCircle2 } from 'lucide-react';

const INITIAL_TEAM: TeamMember[] = [
  { id: 'm-1', email: 'owner@store.com', full_name: 'Alex Owner', role: 'owner', status: 'active', joined_at: '2026-01-10' },
  { id: 'm-2', email: 'cashier1@store.com', full_name: 'Sam Cashier', role: 'cashier', status: 'active', joined_at: '2026-03-15' },
  { id: 'm-3', email: 'inventory@store.com', full_name: 'Morgan Inventory', role: 'inventory_manager', status: 'active', joined_at: '2026-05-20' },
  { id: 'm-4', email: 'accountant@store.com', full_name: 'Taylor Finance', role: 'accountant', status: 'active', joined_at: '2026-06-01' },
];

export const TeamManagementPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('cashier');

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      email: inviteEmail,
      full_name: inviteName,
      role: inviteRole,
      status: 'invited',
      joined_at: new Date().toISOString().split('T')[0],
    };

    setMembers([...members, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
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
            Invite team members, assign store roles, and enforce granular access permissions
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg shadow-hacker-orange flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> INVITE TEAM MEMBER
        </button>
      </div>

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
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-[10px]">
                      {m.full_name.charAt(0)}
                    </div>
                    <span>{m.full_name}</span>
                  </td>
                  <td className="p-3 text-slate-600">{m.email}</td>
                  <td className="p-3 text-center">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {m.status === 'active' ? (
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        INVITED
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center text-slate-500">{m.joined_at}</td>
                  <td className="p-3 text-center">
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => removeMember(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
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
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">INVITE NEW TEAM MEMBER</h3>
            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                  placeholder="e.g. Jordan Cashier"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">EMAIL ADDRESS</label>
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
                  className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer"
                >
                  SEND INVITATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
