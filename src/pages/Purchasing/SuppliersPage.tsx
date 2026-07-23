'use client';

import React, { useState } from 'react';
import { Supplier, PurchaseOrder } from '@/types/erp';
import { Truck, Plus, PackageCheck, FileText, Building2, Mail, Phone } from 'lucide-react';

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', supplier_code: 'SUP-001', name: 'Global Coffee Importers Ltd', contact_person: 'David Beans', email: 'david@globalcoffee.com', phone: '+1 555-019-2834', address: '450 Roaster Way, Seattle WA' },
  { id: 'sup-2', supplier_code: 'SUP-002', name: 'Fresh Artisan Bakery Wholesale', contact_person: 'Marie Flour', email: 'marie@artisanbakery.com', phone: '+1 555-019-8821', address: '12 Bakers Lane, San Francisco CA' },
  { id: 'sup-3', supplier_code: 'SUP-003', name: 'Apex Medical Supplies Inc', contact_person: 'Dr. Robert Health', email: 'robert@apexmed.com', phone: '+1 555-019-3341', address: '900 Pharma Blvd, Boston MA' },
];

const INITIAL_POS: PurchaseOrder[] = [
  { id: 'po-101', po_number: 'PO-202607-001', supplier_id: 'sup-1', supplier_name: 'Global Coffee Importers Ltd', status: 'received', items_count: 50, total_cost: 400.00, created_at: '2026-07-20' },
  { id: 'po-102', po_number: 'PO-202607-002', supplier_id: 'sup-2', supplier_name: 'Fresh Artisan Bakery Wholesale', status: 'ordered', items_count: 20, total_cost: 150.00, created_at: '2026-07-22' },
];

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
  });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Supplier = {
      id: `sup-${Date.now()}`,
      supplier_code: `SUP-${Date.now().toString().slice(-3)}`,
      name: newSupplier.name,
      contact_person: newSupplier.contact_person,
      email: newSupplier.email,
      phone: newSupplier.phone,
    };
    setSuppliers([...suppliers, created]);
    setShowSupplierModal(false);
    setNewSupplier({ name: '', contact_person: '', email: '', phone: '' });
  };

  const receiveOrder = (poId: string) => {
    setPurchaseOrders(
      purchaseOrders.map((po) => (po.id === poId ? { ...po, status: 'received' } : po))
    );
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

          {activeTab === 'suppliers' && (
            <button
              onClick={() => setShowSupplierModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg shadow-hacker-orange flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ADD SUPPLIER
            </button>
          )}
        </div>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
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
                  <th className="p-3 text-center">ITEMS QTY</th>
                  <th className="p-3 text-right">TOTAL COST</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3 font-bold text-slate-900">{po.po_number}</td>
                    <td className="p-3 font-semibold">{po.supplier_name}</td>
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
                      {po.status !== 'received' && (
                        <button
                          onClick={() => receiveOrder(po.id)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded flex items-center gap-1 mx-auto cursor-pointer"
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
                  className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer"
                >
                  SAVE SUPPLIER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
