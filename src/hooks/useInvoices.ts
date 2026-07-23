import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { CompletedSaleRecord } from '@/store/usePosStore';

export function useInvoices() {
  const activeProject = useAuthStore((s) => s.activeProject);
  const projectId = activeProject?.id;

  return useQuery({
    queryKey: ['invoices', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<CompletedSaleRecord[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select(
          'id, invoice_number, status, grand_total, created_at, customer:customers(name), invoice_items(count), payments(method)'
        )
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        throw new Error(`Failed to load invoices: ${error.message}`);
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        invoice_number: row.invoice_number,
        customer_name: row.customer?.name || 'Walk-in Customer',
        date: new Date(row.created_at).toLocaleString(),
        items_count: Number(row.invoice_items?.[0]?.count ?? 0),
        total_amount: Number(row.grand_total),
        payment_method: row.payments?.[0]?.method || '—',
        status: row.status,
      }));
    },
  });
}
