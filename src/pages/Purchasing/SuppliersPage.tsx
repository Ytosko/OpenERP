'use client';

import React, { useState } from 'react';
import { Truck, Plus, PackageCheck, AlertCircle, FilePlus2, Trash2 } from 'lucide-react';
import {
  useSuppliers,
  useAddSupplier,
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useReceivePurchaseOrder,
  PoLineInput,
} from '@/hooks/useErpData';
import { useProducts } from '@/hooks/useProducts';

export const SuppliersPage: React.FC = () => {
  const { data: suppliers = [], isLoading: suppliersLoading, error: suppliersError } = useSuppliers();
  const { data: purchaseOrders = [], isLoading: posLoading, error: posError } = usePurchaseOrders();
  const { data: products = [] } = useProducts();
  const addSupplier = useAddSupplier();
  const createPo = useCreatePurchaseOrder();
  const receivePo = useReceivePurchaseOrder();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '' });
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poLines, setPoLines] = useState<PoLineInput[]>([{ product_id: '', name: '', quantity: 1, unit_cost: 0 }]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await addSupplier.mutateAsync(newSupplier);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', contact_person: '', email: '', phone: '' });
    } catch (err: any) {
      setActionError(err?.message);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createPo.mutateAsync({ supplier_id: poSupplierId, lines: poLines });
      setShowPoModal(false);
      setPoSupplierId('');
      setPoLines([{ product_id: '', name: '', quantity: 1, unit_cost: 0 }]);
      setActiveTab('orders');
    } catch (err: any) {
      setActionError(err?.message);
    }
  };

  const handleReceive = async (poId: string) => {
    setActionError(null);
    try {
      await receivePo.mutateAsync(poId);
    } catch (err: any) {
      setActionError(err?.message);
    }
  };

  const updateLine = (idx: number, patch: Partial<PoLineInput>) => {
    setPoLines((lines) => lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-500" /> SUPPLIERS & PURCHASE ORDERS RECEIVING
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Manage vendor contacts, issue purchase orders, and receive stock into inventory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                activeTab === 'suppliers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Suppliers ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
          </div>

          {activeTab === 'suppliers' ? (
            <button
              onClick={() => setShowSupplierModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg shadow-hacker-orange flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ADD SUPPLIER
            </button>
          ) : (
            <button
              onClick={() => setShowPoModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg shadow-hacker-orange flex items-center gap-1 cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" /> NEW PURCHASE ORDER
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {(suppliersError || posError) && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{((suppliersError || posError) as Error).message}</span>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <>
          {suppliersLoading && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-400 text-center">
              LOADING SUPPLIERS...
            </div>
          )}
          {!suppliersLoading && suppliers.length === 0 && !suppliersError && (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-slate-400 text-center">
              No suppliers yet. Add your first vendor to start issuing purchase orders.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 text-xs">{s.name}</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{s.supplier_code}</span>
                </div>

                <div className="space-y-1 text-slate-600">
                  {s.contact_person && <div>Contact: <span className="font-semibold text-slate-800">{s.contact_person}</span></div>}
                  {s.email && <div>Email: {s.email}</div>}
                  {s.phone && <div>Tel: {s.phone}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">PO #</th>
                  <th className="p-3">SUPPLIER</th>
                  <th className="p-3">DATE</th>
                  <th className="p-3 text-center">ITEMS QTY</th>
                  <th className="p-3 text-right">TOTAL COST</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {posLoading && (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">LOADING PURCHASE ORDERS...</td></tr>
                )}
                {!posLoading && purchaseOrders.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">No purchase orders yet.</td></tr>
                )}
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3 font-bold text-slate-900">{po.po_number}</td>
                    <td className="p-3 font-semibold">{po.supplier_name}</td>
                    <td className="p-3 text-slate-500">{po.created_at}</td>
                    <td className="p-3 text-center">{po.items_count}</td>
                    <td className="p-3 text-right font-bold">${po.total_cost.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {po.status === 'ordered' && (
                        <button
                          onClick={() => handleReceive(po.id)}
                          disabled={receivePo.isPending}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded flex items-center gap-1 mx-auto cursor-pointer disabled:opacity-50"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> RECEIVE STOCK
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">ADD SUPPLIER VENDOR</h3>
            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1">SUPPLIER COMPANY NAME</label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                  placeholder="e.g. Global Coffee Importers"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">CONTACT PERSON</label>
                <input
                  type="text"
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 block mb-1">EMAIL</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">PHONE</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded text-slate-700 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={addSupplier.isPending}
                  className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer disabled:opacity-50"
                >
                  {addSupplier.isPending ? 'SAVING...' : 'SAVE SUPPLIER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {showPoModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">NEW PURCHASE ORDER</h3>
            <form onSubmit={handleCreatePo} className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1">SUPPLIER</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 block">ORDER LINES</label>
                {poLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_64px_80px_28px] gap-2 items-center">
                    <select
                      value={line.product_id}
                      onChange={(e) => {
                        const p = products.find((pr) => pr.id === e.target.value);
                        updateLine(idx, {
                          product_id: e.target.value,
                          name: p?.name || '',
                          unit_cost: p?.cost_price ?? line.unit_cost,
                        });
                      }}
                      className="p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
                    >
                      <option value="">Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: parseInt(e.target.value) || 0 })}
                      className="p-2 border border-slate-300 rounded text-center"
                      title="Quantity"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={line.unit_cost}
                      onChange={(e) => updateLine(idx, { unit_cost: parseFloat(e.target.value) || 0 })}
                      className="p-2 border border-slate-300 rounded text-right"
                      title="Unit cost ($)"
                    />
                    <button
                      type="button"
                      onClick={() => setPoLines((lines) => lines.filter((_, i) => i !== idx))}
                      disabled={poLines.length === 1}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                      title="Remove line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPoLines((lines) => [...lines, { product_id: '', name: '', quantity: 1, unit_cost: 0 }])}
                  className="text-brand-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add line
                </button>
              </div>

              <div className="flex justify-between font-bold border-t pt-2">
                <span>ESTIMATED TOTAL</span>
                <span>
                  ${poLines.reduce((s, l) => s + (l.quantity || 0) * (l.unit_cost || 0), 0).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded text-slate-700 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createPo.isPending}
                  className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer disabled:opacity-50"
                >
                  {createPo.isPending ? 'CREATING...' : 'ISSUE PURCHASE ORDER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
