'use client';

import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  sales_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  { id: '1', sku: 'COF-101', barcode: '8901001001', name: 'Double Espresso 12oz', category: 'Coffee', sales_price: 3.75, cost_price: 0.60, stock_quantity: 999, low_stock_threshold: 0 },
  { id: '2', sku: 'COF-102', barcode: '8901001002', name: 'Oat Milk Latte 16oz', category: 'Coffee', sales_price: 5.50, cost_price: 1.20, stock_quantity: 999, low_stock_threshold: 0 },
  { id: '3', sku: 'BAK-201', barcode: '8902001001', name: 'Fresh Butter Croissant', category: 'Bakery', sales_price: 4.25, cost_price: 1.10, stock_quantity: 24, low_stock_threshold: 10 },
  { id: '4', sku: 'BAK-202', barcode: '8902001002', name: 'Chocolate Almond Muffin', category: 'Bakery', sales_price: 4.50, cost_price: 1.25, stock_quantity: 3, low_stock_threshold: 5 },
  { id: '5', sku: 'MER-301', barcode: '8903001001', name: 'Ethiopia Whole Bean 250g', category: 'Beans', sales_price: 18.50, cost_price: 8.00, stock_quantity: 4, low_stock_threshold: 6 },
];

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'General',
    sales_price: 0,
    cost_price: 0,
    stock_quantity: 10,
  });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ProductItem = {
      id: `p-${Date.now()}`,
      sku: newProduct.sku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: `890${Date.now().toString().slice(-7)}`,
      name: newProduct.name,
      category: newProduct.category,
      sales_price: newProduct.sales_price,
      cost_price: newProduct.cost_price,
      stock_quantity: newProduct.stock_quantity,
      low_stock_threshold: 5,
    };

    setProducts([created, ...products]);
    setShowModal(false);
    setNewProduct({ sku: '', name: '', category: 'General', sales_price: 0, cost_price: 0, stock_quantity: 10 });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-500" /> PRODUCT CATALOG & INVENTORY LEDGER
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">Manage SKUs, prices, barcodes, and low stock thresholds</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg shadow-hacker-orange flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> ADD PRODUCT
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by product name, SKU, or category..."
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:border-brand-500 outline-none shadow-sm"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">SKU / BARCODE</th>
                <th className="p-3">PRODUCT NAME</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3 text-right">COST PRICE</th>
                <th className="p-3 text-right">RETAIL PRICE</th>
                <th className="p-3 text-center">STOCK QTY</th>
                <th className="p-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.map((p) => {
                const isLowStock = p.stock_quantity <= p.low_stock_threshold && p.low_stock_threshold > 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.sku}</div>
                      <div className="text-[10px] text-slate-400">{p.barcode}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 text-right">${p.cost_price.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-brand-600">${p.sales_price.toFixed(2)}</td>
                    <td className="p-3 text-center font-bold">{p.stock_quantity}</td>
                    <td className="p-3 text-center">
                      {isLowStock ? (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          IN STOCK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">ADD NEW PRODUCT</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1">PRODUCT NAME</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 outline-none"
                  placeholder="e.g. Espresso Beans 1kg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                    placeholder="COF-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">CATEGORY</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-500 block mb-1">COST ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({ ...newProduct, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">RETAIL ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.sales_price}
                    onChange={(e) => setNewProduct({ ...newProduct, sales_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">INITIAL STOCK</label>
                  <input
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded text-slate-700 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-500 text-white font-bold rounded shadow-hacker-orange cursor-pointer"
                >
                  SAVE PRODUCT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
