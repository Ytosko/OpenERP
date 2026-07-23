import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { PosProduct } from '@/store/usePosStore';

export interface CatalogProduct extends PosProduct {
  category_name: string;
  low_stock_threshold: number;
}

export function useProducts() {
  const activeProject = useAuthStore((s) => s.activeProject);
  const projectId = activeProject?.id;
  const storeId = activeProject?.default_store_id;

  return useQuery({
    queryKey: ['products', projectId, storeId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<CatalogProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(
          'id, sku, barcode, name, category_id, sales_price, cost_price, unit, track_stock, low_stock_threshold, category:product_categories(name), inventory_balances(store_id, quantity)'
        )
        .eq('project_id', projectId!)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to load products: ${error.message}`);
      }

      return (data || []).map((row: any) => {
        const balance = (row.inventory_balances || []).find(
          (b: any) => !storeId || b.store_id === storeId
        );
        return {
          id: row.id,
          sku: row.sku,
          barcode: row.barcode || undefined,
          name: row.name,
          category_id: row.category_id || undefined,
          category_name: row.category?.name || 'General',
          sales_price: Number(row.sales_price),
          cost_price: Number(row.cost_price),
          unit: row.unit,
          track_stock: row.track_stock,
          low_stock_threshold: Number(row.low_stock_threshold ?? 5),
          stock_quantity: row.track_stock ? Number(balance?.quantity ?? 0) : 999,
        };
      });
    },
  });
}

export interface NewProductInput {
  sku: string;
  name: string;
  barcode?: string;
  unit?: string;
  sales_price: number;
  cost_price: number;
  track_stock?: boolean;
  low_stock_threshold?: number;
  opening_qty?: number;
  category_name?: string;
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  const activeProject = useAuthStore((s) => s.activeProject);

  return useMutation({
    mutationFn: async (input: NewProductInput) => {
      if (!activeProject?.id || !activeProject.default_store_id) {
        throw new Error('No active store selected.');
      }

      const { data, error } = await supabase.rpc('add_product_with_opening_stock', {
        p_project_id: activeProject.id,
        p_store_id: activeProject.default_store_id,
        p_sku: input.sku,
        p_name: input.name,
        p_barcode: input.barcode ?? null,
        p_unit: input.unit ?? 'item',
        p_sales_price: input.sales_price,
        p_cost_price: input.cost_price,
        p_track_stock: input.track_stock ?? true,
        p_low_stock_threshold: input.low_stock_threshold ?? 5,
        p_opening_qty: input.opening_qty ?? 0,
        p_category_name: input.category_name ?? null,
      });

      if (error) {
        throw new Error(`Failed to add product: ${error.message}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
