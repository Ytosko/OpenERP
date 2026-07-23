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

export async function executeSaleRPC(payload: ExecuteSalePayload) {
  // If online & Supabase configured -> execute atomic Postgres RPC complete_sale
  if (navigator.onLine && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('complete_sale', payload);
      if (error) {
        throw new Error(error.message);
      }
      return {
        ...data,
        synced: true,
        offlineQueued: false,
      };
    } catch (err: any) {
      console.warn('Real Supabase RPC executeSale failed, queuing for offline sync:', err);
      const queued = saveOfflineSale(payload);
      return {
        invoice_number: `INV-OFFLINE-${Date.now().toString().slice(-6)}`,
        synced: false,
        offlineQueued: true,
        queueId: queued.id,
      };
    }
  }

  // Offline / Demo Mode -> Save to offline queue explicitly
  const queued = saveOfflineSale(payload);
  return {
    invoice_number: `INV-LOCAL-${Date.now().toString().slice(-6)}`,
    synced: false,
    offlineQueued: true,
    queueId: queued.id,
  };
}
