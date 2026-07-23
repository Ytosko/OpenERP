import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { saveOfflineSale } from '@/lib/offline-sync';

export interface ExecuteSalePayload {
  p_project_id: string;
  p_store_id: string;
  p_customer_id?: string | null;
  p_items: Array<{ product_id: string; quantity: number; unit_price: number }>;
  p_payments: Array<{ method: string; amount: number }>;
  p_discount_total: number;
  p_notes?: string | null;
}

export interface ExecuteSaleResult {
  id?: string;
  invoice_number: string;
  subtotal?: number;
  grand_total?: number;
  paid_total?: number;
  change_total?: number;
  synced: boolean;
  offlineQueued: boolean;
  queueId?: string;
}

/**
 * Executes the atomic complete_sale Postgres RPC.
 * - Device offline / server unreachable: the sale is queued locally and
 *   flagged offlineQueued so the UI shows it was NOT written to the database.
 * - Server rejection (auth, RLS, validation): throws — a rejected sale must
 *   never be queued for retry or reported as success.
 */
export async function executeSaleRPC(payload: ExecuteSalePayload): Promise<ExecuteSaleResult> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and rebuild.'
    );
  }

  if (!navigator.onLine) {
    const queued = saveOfflineSale(payload);
    return {
      invoice_number: `INV-OFFLINE-${Date.now().toString().slice(-6)}`,
      synced: false,
      offlineQueued: true,
      queueId: queued.id,
    };
  }

  let data: any;
  let error: { message: string } | null;
  try {
    ({ data, error } = await supabase.rpc('complete_sale', payload));
  } catch (err: any) {
    // Thrown (not returned) errors are transport failures — server unreachable.
    console.warn('Sale queued offline after network failure:', err);
    const queued = saveOfflineSale(payload);
    return {
      invoice_number: `INV-OFFLINE-${Date.now().toString().slice(-6)}`,
      synced: false,
      offlineQueued: true,
      queueId: queued.id,
    };
  }

  if (error) {
    throw new Error(`Sale rejected by server: ${error.message}`);
  }

  return {
    ...(data as object),
    synced: true,
    offlineQueued: false,
  } as ExecuteSaleResult;
}
