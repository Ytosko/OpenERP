'use client';

import React, { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProducts } from '@/hooks/useProducts';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { executeSaleRPC } from '@/lib/db-client';
import { openCashDrawer } from '@/lib/hardware-printer';
import { DigitalReceiptModal } from '@/components/receipt/DigitalReceiptModal';
import { PrintRenderer } from '@/components/print-designer/PrintRenderer';
import { calculateCartTotals, toCents, fromCents } from '@/lib/money';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  PauseCircle,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  CheckCircle2,
  Gift,
  Share2,
  Zap,
  FolderOpen,
  Cloud,
  CloudOff,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';

export const PosTerminalPage: React.FC = () => {
  const { activeProject, user } = useAuthStore();
  const {
    cart,
    addToCart,
    updateQuantity,
    clearCart,
    searchQuery,
    setSearchQuery,
    discountTotal,
    setDiscountTotal,
    paymentMethod,
    setPaymentMethod,
    cashPaid,
    setCashPaid,
    checkoutOpen,
    setCheckoutOpen,
    holdSale,
    recordCompletedSale,
  } = usePosStore();

  const { redeemPoints, earnPoints } = useLoyaltyStore();
  const { templates, schema: activePrintTemplate } = usePrintDesignerStore();

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(activePrintTemplate.id);

  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts();

  // Exact Cents Integer Math Calculation
  const { subtotal, grandTotal } = calculateCartTotals(cart, discountTotal, 0);
  const changeDue = Math.max(0, fromCents(toCents(cashPaid) - toCents(grandTotal)));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  );

  const handleRedeemLoyalty = () => {
    const discount = redeemPoints('cust-1', 100);
    if (discount > 0) {
      setDiscountTotal(discountTotal + discount);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;

    if (!activeProject?.id || !activeProject.default_store_id) {
      setCheckoutError('No active store selected. Finish onboarding or pick a store from the sidebar.');
      return;
    }

    setLoading(true);
    setCheckoutError(null);

    try {
      const payload = {
        p_project_id: activeProject.id,
        p_store_id: activeProject.default_store_id,
        p_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        p_payments: [{ method: paymentMethod, amount: paymentMethod === 'CASH' ? cashPaid : grandTotal }],
        p_discount_total: discountTotal,
      };

      const result = await executeSaleRPC(payload);
      earnPoints('cust-1', grandTotal);

      if (paymentMethod === 'CASH') {
        openCashDrawer();
      }

      const invoiceNum = result?.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
      const isOfflineQueued = result?.offlineQueued ?? false;

      recordCompletedSale({
        id: `inv-${Date.now()}`,
        invoice_number: invoiceNum,
        customer_name: 'Walk-in Customer',
        date: new Date().toLocaleString(),
        items_count: cart.reduce((sum, item) => sum + item.quantity, 0),
        total_amount: grandTotal,
        payment_method: paymentMethod,
        status: isOfflineQueued ? 'queued_offline' : 'completed',
      });

      setCompletedSale({
        invoice_number: invoiceNum,
        items: [...cart],
        subtotal,
        discountTotal,
        grandTotal,
        cashPaid,
        changeDue,
        date: new Date().toLocaleString(),
        offlineQueued: isOfflineQueued,
      });

      setCheckoutOpen(false);
    } catch (err: any) {
      console.error(err);
      setCheckoutError(err?.message || 'Sale failed. Nothing was recorded.');
    } finally {
      setLoading(false);
    }
  };

  const currentPrintTemplate =
    templates.find((t) => t.id === selectedTemplateId) || activePrintTemplate;

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
      {/* Products & Quick Search Area (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
        {/* Search Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or scan barcode..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-brand-500 font-bold"
            />
          </div>

          <button
            onClick={() => openCashDrawer()}
            className="px-3 py-1.5 border border-slate-300 hover:border-slate-400 rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0 text-slate-800"
            title="Trigger cash drawer signal"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> DRAWER
          </button>
        </div>

        {/* Product Touch Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
          {productsLoading && (
            <div className="col-span-full py-12 text-center text-slate-400">
              LOADING PRODUCT CATALOG...
            </div>
          )}
          {productsError && (
            <div className="col-span-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{(productsError as Error).message}</span>
            </div>
          )}
          {!productsLoading && !productsError && filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <PackageOpen className="w-8 h-8 text-slate-300" />
              <span>No products in this store yet. Add products from the Products & Inventory page.</span>
            </div>
          )}
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-card-hover text-left flex flex-col justify-between transition-all cursor-pointer group"
            >
              <div>
                <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                  <span>{product.sku}</span>
                  {product.track_stock && (
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        product.stock_quantity <= 5
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.stock_quantity} left
                    </span>
                  )}
                </div>
                <h4 className="font-mono text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-brand-600">
                  {product.name}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-900">
                  ${product.sales_price.toFixed(2)}
                </span>
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <Plus className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Drawer & Checkout (5 cols) */}
      <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <h3 className="font-mono text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-500" />
              CURRENT POS SALE ({cart.length})
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[10px] font-mono text-red-500 hover:underline cursor-pointer font-bold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                Cart is empty. Tap any product on the left to add.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                    <div className="text-[10px] text-slate-500">
                      ${item.unit_price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-300 rounded bg-white">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold w-14 text-right">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Loyalty Reward Banner */}
        {cart.length > 0 && (
          <div className="p-2 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between my-2">
            <div className="flex items-center gap-1.5 text-brand-700 font-bold text-[10px]">
              <Gift className="w-3.5 h-3.5" /> Customer Points: 250
            </div>
            <button
              onClick={handleRedeemLoyalty}
              className="px-2 py-0.5 bg-brand-500 text-white rounded text-[10px] font-bold shadow-hacker-orange cursor-pointer"
            >
              Redeem 100 Pts ($10 Off)
            </button>
          </div>
        )}

        {/* Cart Totals & Checkout Button */}
        <div className="border-t border-slate-200 pt-3 space-y-3 font-mono text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Loyalty Discount</span>
              <span>-${discountTotal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2">
            <span>GRAND TOTAL</span>
            <span className="text-brand-600">${grandTotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={holdSale}
              disabled={cart.length === 0}
              className="py-2.5 px-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1"
            >
              <PauseCircle className="w-4 h-4" /> HOLD
            </button>
            <button
              onClick={() => {
                setCashPaid(grandTotal);
                setCheckoutOpen(true);
              }}
              disabled={cart.length === 0}
              className="py-2.5 px-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg shadow-hacker-orange transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1"
            >
              PAY ${grandTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Payment Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex justify-between">
              <span>COMPLETE PAYMENT</span>
              <span className="text-brand-600">${grandTotal.toFixed(2)}</span>
            </h3>

            {checkoutError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{checkoutError}</span>
              </div>
            )}

            {/* Payment Method Options */}
            <div>
              <label className="text-slate-500 block mb-1">SELECT METHOD</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'CARD', 'QR_PAY'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2.5 border rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      paymentMethod === method
                        ? 'border-brand-500 bg-brand-50 text-brand-600 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {method === 'CASH' && <Banknote className="w-4 h-4" />}
                    {method === 'CARD' && <CreditCard className="w-4 h-4" />}
                    {method === 'QR_PAY' && <QrCode className="w-4 h-4" />}
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Input */}
            {paymentMethod === 'CASH' && (
              <div>
                <label className="text-slate-500 block mb-1">CASH RECEIVED ($)</label>
                <input
                  type="number"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold p-2 border border-slate-300 rounded-lg focus:border-brand-500 outline-none"
                />

                {changeDue > 0 && (
                  <div className="mt-2 text-emerald-600 font-bold flex justify-between bg-emerald-50 p-2 rounded">
                    <span>CHANGE DUE:</span>
                    <span>${changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCheckoutOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 cursor-pointer font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={handleCheckoutSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-brand-500 text-white font-bold rounded-lg shadow-hacker-orange cursor-pointer disabled:opacity-50"
              >
                {loading ? 'PROCESSING...' : 'CONFIRM SALE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Sale Print Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl font-mono text-xs flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">SALE COMPLETED!</h3>
            <p className="text-slate-500 text-center font-bold">{completedSale.invoice_number}</p>

            {/* Explicit Sync / Offline Queued Status Banner */}
            {completedSale.offlineQueued ? (
              <div className="w-full bg-amber-50 border border-amber-300 text-amber-800 p-2 rounded-lg text-[11px] font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CloudOff className="w-4 h-4 text-amber-600" /> OFFLINE QUEUED
                </span>
                <span className="text-[10px]">Saved to Local Queue</span>
              </div>
            ) : (
              <div className="w-full bg-emerald-50 border border-emerald-300 text-emerald-800 p-2 rounded-lg text-[11px] font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Cloud className="w-4 h-4 text-emerald-600" /> SUPABASE SYNCED
                </span>
                <span className="text-[10px]">Live Database Written</span>
              </div>
            )}

            {/* Template Selector Dropdown */}
            <div className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase">
                <FolderOpen className="w-3.5 h-3.5 text-brand-500" /> SELECT PRINT DESIGN / TEMPLATE
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:border-brand-500 outline-none text-xs cursor-pointer"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    📄 {t.name} ({t.page.width}{t.page.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Real Data Render through Selected Custom Print Design */}
            <div className="w-full border-t border-slate-200 pt-3 flex justify-center max-h-[300px] overflow-y-auto">
              <PrintRenderer
                schema={currentPrintTemplate}
                sampleData={{
                  storeName: activeProject?.name || 'HACKER MART STORE',
                  storeAddress: '100 Technology Way, San Francisco, CA',
                  invoiceNumber: completedSale.invoice_number,
                  dateTime: completedSale.date,
                  cashier: user?.full_name || 'Alex Cashier',
                  customerName: 'Walk-in Customer',
                  items: completedSale.items.map((i: any) => ({
                    name: i.product.name,
                    sku: i.product.sku,
                    qty: i.quantity,
                    price: i.unit_price,
                    total: i.unit_price * i.quantity,
                  })),
                  subtotal: completedSale.subtotal,
                  discount: completedSale.discountTotal,
                  tax: 0,
                  grandTotal: completedSale.grandTotal,
                }}
              />
            </div>

            <div className="flex gap-2 w-full pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-brand-500" /> PRINT RECEIPT
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="py-2 px-3 border border-slate-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-brand-500" /> SHARE
              </button>

              <button
                onClick={() => {
                  setCompletedSale(null);
                  clearCart();
                }}
                className="py-2 px-3 bg-brand-500 text-white font-bold rounded-lg shadow-hacker-orange cursor-pointer"
              >
                NEW SALE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Share Modal */}
      {completedSale && (
        <DigitalReceiptModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          invoiceNumber={completedSale.invoice_number}
          totalAmount={completedSale.grandTotal}
        />
      )}
    </div>
  );
};
