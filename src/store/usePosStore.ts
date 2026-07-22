import { create } from 'zustand';

export interface PosProduct {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category_id?: string;
  sales_price: number;
  cost_price: number;
  unit: string;
  track_stock: boolean;
  stock_quantity: number;
}

export interface CartItem {
  product: PosProduct;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface PosState {
  cart: CartItem[];
  selectedCategory: string | null;
  searchQuery: string;
  selectedCustomer: Customer | null;
  discountTotal: number;
  paymentMethod: 'CASH' | 'CARD' | 'QR_PAY' | 'SPLIT';
  cashPaid: number;
  checkoutOpen: boolean;
  heldSales: Array<{ id: string; cart: CartItem[]; customer: Customer | null; date: string }>;
  
  addToCart: (product: PosProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setDiscountTotal: (discount: number) => void;
  setPaymentMethod: (method: 'CASH' | 'CARD' | 'QR_PAY' | 'SPLIT') => void;
  setCashPaid: (amount: number) => void;
  setCheckoutOpen: (open: boolean) => void;
  holdSale: () => void;
  resumeSale: (heldSaleId: string) => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  selectedCategory: null,
  searchQuery: '',
  selectedCustomer: null,
  discountTotal: 0,
  paymentMethod: 'CASH',
  cashPaid: 0,
  checkoutOpen: false,
  heldSales: [],

  addToCart: (product) => {
    const { cart } = get();
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      set({ cart: updated });
    } else {
      set({ cart: [...cart, { product, quantity: 1, unit_price: product.sales_price, discount: 0 }] });
    }
  },

  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) })),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () =>
    set({
      cart: [],
      selectedCustomer: null,
      discountTotal: 0,
      cashPaid: 0,
      checkoutOpen: false,
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),
  setDiscountTotal: (discountTotal) => set({ discountTotal }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCashPaid: (cashPaid) => set({ cashPaid }),
  setCheckoutOpen: (checkoutOpen) => set({ checkoutOpen }),

  holdSale: () => {
    const { cart, selectedCustomer, heldSales } = get();
    if (cart.length === 0) return;

    const newHeld = {
      id: `HOLD-${Date.now()}`,
      cart: [...cart],
      customer: selectedCustomer,
      date: new Date().toLocaleTimeString(),
    };

    set({ heldSales: [...heldSales, newHeld] });
    get().clearCart();
  },

  resumeSale: (heldSaleId) => {
    const { heldSales } = get();
    const target = heldSales.find((s) => s.id === heldSaleId);
    if (!target) return;

    set({
      cart: target.cart,
      selectedCustomer: target.customer,
      heldSales: heldSales.filter((s) => s.id !== heldSaleId),
    });
  },
}));
