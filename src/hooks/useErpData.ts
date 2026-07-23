import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { ProjectRole } from '@/types/erp';

function useProjectId() {
  return useAuthStore((s) => s.activeProject?.id);
}

// ---------------- Suppliers ----------------

export interface DbSupplier {
  id: string;
  supplier_code: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function useSuppliers() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['suppliers', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<DbSupplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_code, name, contact_person, email, phone, address')
        .eq('project_id', projectId!)
        .order('created_at');
      if (error) throw new Error(`Failed to load suppliers: ${error.message}`);
      return (data || []) as DbSupplier[];
    },
  });
}

export function useAddSupplier() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; contact_person?: string; email?: string; phone?: string }) => {
      if (!projectId) throw new Error('No active store selected.');
      const code = `SUP-${Date.now().toString().slice(-5)}`;
      const { error } = await supabase.from('suppliers').insert({
        project_id: projectId,
        supplier_code: code,
        name: input.name,
        contact_person: input.contact_person || null,
        email: input.email || null,
        phone: input.phone || null,
      });
      if (error) throw new Error(`Failed to add supplier: ${error.message}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

// ---------------- Purchase Orders ----------------

export interface DbPurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  supplier_name: string;
  status: string;
  items_count: number;
  total_cost: number;
  created_at: string;
}

export interface PoLineInput {
  product_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
}

export function usePurchaseOrders() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['purchase_orders', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<DbPurchaseOrder[]> => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, po_number, supplier_id, status, items, total_cost, created_at, supplier:suppliers(name)')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Failed to load purchase orders: ${error.message}`);
      return (data || []).map((row: any) => ({
        id: row.id,
        po_number: row.po_number,
        supplier_id: row.supplier_id || undefined,
        supplier_name: row.supplier?.name || '—',
        status: row.status,
        items_count: Array.isArray(row.items)
          ? row.items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0)
          : 0,
        total_cost: Number(row.total_cost),
        created_at: new Date(row.created_at).toLocaleDateString(),
      }));
    },
  });
}

export function useCreatePurchaseOrder() {
  const activeProject = useAuthStore((s) => s.activeProject);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { supplier_id: string; lines: PoLineInput[] }) => {
      if (!activeProject?.id || !activeProject.default_store_id) throw new Error('No active store selected.');
      const lines = input.lines.filter((l) => l.product_id && l.quantity > 0);
      if (lines.length === 0) throw new Error('Add at least one product line.');
      const total = lines.reduce((sum, l) => sum + l.quantity * l.unit_cost, 0);
      const { error } = await supabase.from('purchase_orders').insert({
        project_id: activeProject.id,
        store_id: activeProject.default_store_id,
        supplier_id: input.supplier_id || null,
        po_number: `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-5)}`,
        status: 'ordered',
        items: lines,
        total_cost: Math.round(total * 100) / 100,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw new Error(`Failed to create purchase order: ${error.message}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (poId: string) => {
      const { data, error } = await supabase.rpc('receive_purchase_order', { p_po_id: poId });
      if (error) throw new Error(`Failed to receive stock: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ---------------- Team ----------------

export interface DbTeamMember {
  user_id: string;
  email: string;
  full_name: string;
  role: ProjectRole;
  status: string;
  joined_at: string;
}

export function useTeamMembers() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['team', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<DbTeamMember[]> => {
      const { data, error } = await supabase.rpc('list_team_members', { p_project_id: projectId });
      if (error) throw new Error(`Failed to load team: ${error.message}`);
      return (data || []).map((row: any) => ({
        ...row,
        joined_at: new Date(row.joined_at).toISOString().split('T')[0],
      }));
    },
  });
}

export function useInviteMember() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: ProjectRole }) => {
      if (!projectId) throw new Error('No active store selected.');
      const { error } = await supabase.rpc('invite_member_by_email', {
        p_project_id: projectId,
        p_email: input.email,
        p_role: input.role,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useRemoveMember() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!projectId) throw new Error('No active store selected.');
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      if (error) throw new Error(`Failed to remove member: ${error.message}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}

// ---------------- Project Settings (branding, tax, payment gateways) ----------------

export interface ProjectSettings {
  tax_rate?: number;
  tax_id?: string;
  address?: string;
  phone?: string;
  currency_symbol?: string;
  receipt_footer?: string;
  payment_gateways?: Array<{
    id: string;
    name: string;
    provider: string;
    enabled: boolean;
    apiKey?: string;
    merchantId?: string;
    instructions?: string;
  }>;
}

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  currency_code: string;
  settings: ProjectSettings;
}

export function useProjectRecord() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['project', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ProjectRecord> => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, logo_url, currency_code, settings')
        .eq('id', projectId!)
        .single();
      if (error) throw new Error(`Failed to load store settings: ${error.message}`);
      return { ...data, settings: (data.settings || {}) as ProjectSettings } as ProjectRecord;
    },
  });
}

export function useUpdateProject() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const refreshProjects = useAuthStore((s) => s.refreshProjects);
  return useMutation({
    mutationFn: async (patch: { name?: string; currency_code?: string; logo_url?: string; settings?: ProjectSettings }) => {
      if (!projectId) throw new Error('No active store selected.');
      const { error } = await supabase.from('projects').update(patch).eq('id', projectId);
      if (error) throw new Error(`Failed to save settings: ${error.message}`);
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['project'] });
      await refreshProjects();
    },
  });
}

/** Uploads a logo image to the store-assets bucket and returns its public URL. */
export async function uploadStoreLogo(projectId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${projectId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('store-assets').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw new Error(`Logo upload failed: ${error.message}`);
  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

// ---------------- Financial Reports ----------------

export interface ReportData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  invoiceCount: number;
  avgTicket: number;
  byPaymentMethod: Array<{ method: string; total: number }>;
  byCashier: Array<{ name: string; total: number; count: number }>;
  lowStock: Array<{ name: string; sku: string; quantity: number; threshold: number }>;
}

export function useFinancialReport(days: number = 30) {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['report', projectId, days],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ReportData> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [invoicesRes, paymentsRes, movementsRes, lowStockRes, teamRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('grand_total, created_by')
          .eq('project_id', projectId!)
          .gte('created_at', since),
        supabase
          .from('payments')
          .select('method, amount')
          .eq('project_id', projectId!)
          .gte('created_at', since),
        supabase
          .from('stock_movements')
          .select('quantity_delta, unit_cost')
          .eq('project_id', projectId!)
          .eq('movement_type', 'sale')
          .gte('created_at', since),
        supabase
          .from('products')
          .select('name, sku, low_stock_threshold, track_stock, inventory_balances(quantity)')
          .eq('project_id', projectId!)
          .eq('is_active', true)
          .eq('track_stock', true),
        supabase.rpc('list_team_members', { p_project_id: projectId }),
      ]);

      for (const res of [invoicesRes, paymentsRes, movementsRes, lowStockRes]) {
        if (res.error) throw new Error(`Failed to load report data: ${res.error.message}`);
      }

      const invoices = invoicesRes.data || [];
      const totalRevenue = invoices.reduce((s: number, r: any) => s + Number(r.grand_total), 0);
      const totalCost = (movementsRes.data || []).reduce(
        (s: number, m: any) => s + Math.abs(Number(m.quantity_delta)) * Number(m.unit_cost || 0),
        0
      );

      const methodMap = new Map<string, number>();
      for (const p of paymentsRes.data || []) {
        methodMap.set(p.method, (methodMap.get(p.method) || 0) + Number(p.amount));
      }

      const nameByUser = new Map<string, string>();
      for (const m of teamRes.data || []) {
        nameByUser.set(m.user_id, m.full_name);
      }
      const cashierMap = new Map<string, { total: number; count: number }>();
      for (const inv of invoices) {
        const key = inv.created_by as string;
        const cur = cashierMap.get(key) || { total: 0, count: 0 };
        cur.total += Number(inv.grand_total);
        cur.count += 1;
        cashierMap.set(key, cur);
      }

      const lowStock = (lowStockRes.data || [])
        .map((p: any) => ({
          name: p.name,
          sku: p.sku,
          quantity: Number(p.inventory_balances?.[0]?.quantity ?? 0),
          threshold: Number(p.low_stock_threshold),
        }))
        .filter((p: any) => p.threshold > 0 && p.quantity <= p.threshold);

      return {
        totalRevenue,
        totalCost,
        grossProfit: totalRevenue - totalCost,
        invoiceCount: invoices.length,
        avgTicket: invoices.length ? totalRevenue / invoices.length : 0,
        byPaymentMethod: [...methodMap.entries()]
          .map(([method, total]) => ({ method, total }))
          .sort((a, b) => b.total - a.total),
        byCashier: [...cashierMap.entries()]
          .map(([id, v]) => ({ name: nameByUser.get(id) || 'Unknown', ...v }))
          .sort((a, b) => b.total - a.total),
        lowStock,
      };
    },
  });
}
