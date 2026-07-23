// Offline-First Queue & Real Supabase Sync Engine

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface OfflineSale {
  id: string;
  payload: any;
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
  errorCount: number;
}

const STORAGE_KEY = 'modular_pos_offline_queue_v2';

export function getOfflineQueue(): OfflineSale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineSale(payload: any): OfflineSale {
  const queue = getOfflineQueue();
  const newSale: OfflineSale = {
    id: `OFFLINE-${Date.now()}`,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
    errorCount: 0,
  };
  queue.push(newSale);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return newSale;
}

export function clearSyncedSales(syncedIds: string[]) {
  const queue = getOfflineQueue();
  const remaining = queue.filter((item) => !syncedIds.includes(item.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

export async function syncOfflineQueue(): Promise<{ syncedCount: number; failedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  if (!navigator.onLine) {
    console.log('Cannot sync: device is offline');
    return { syncedCount: 0, failedCount: queue.length };
  }

  const syncedIds: string[] = [];
  let failedCount = 0;

  for (const sale of queue) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.rpc('complete_sale', sale.payload);
        if (!error) {
          syncedIds.push(sale.id);
        } else {
          console.error('Supabase RPC offline sync error:', error.message);
          failedCount++;
        }
      } catch (err) {
        console.error('Failed to sync offline transaction:', sale.id, err);
        failedCount++;
      }
    } else {
      // Local fallback sync simulation for offline demo mode
      syncedIds.push(sale.id);
    }
  }

  clearSyncedSales(syncedIds);
  return { syncedCount: syncedIds.length, failedCount };
}
