export type ProjectRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'cashier'
  | 'inventory_manager'
  | 'accountant'
  | 'viewer';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: ProjectRole;
  status: 'active' | 'invited';
  joined_at: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  provider: 'cash' | 'card_terminal' | 'stripe' | 'square' | 'qr_mobile' | 'custom_webhook';
  enabled: boolean;
  apiKey?: string;
  merchantId?: string;
  instructions?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateToUsd: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateToUsd: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateToUsd: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateToUsd: 0.78 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rateToUsd: 118.0 },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', rateToUsd: 1.36 },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar font', rateToUsd: 1.52 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUsd: 83.5 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUsd: 155.0 },
];

export interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  items_count: number;
  total_cost: number;
  created_at: string;
}
