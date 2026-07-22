-- Migration: 202607230002_rls_policies.sql
-- Row Level Security (RLS) Policies and Security Helpers

-- 1. Helper Function: Is Project Member
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = (SELECT auth.uid())
      AND pm.status = 'active'
  );
$$;

-- 2. Helper Function: Has Project Role
CREATE OR REPLACE FUNCTION public.has_project_role(
  p_project_id UUID,
  p_roles public.project_role[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = (SELECT auth.uid())
      AND pm.status = 'active'
      AND pm.role = ANY(p_roles)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_project_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_member(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_project_role(UUID, public.project_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_project_role(UUID, public.project_role[]) TO authenticated;

-- Enable RLS on Tenant Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY "Users edit own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()));

-- Policies for Projects
CREATE POLICY "Members view projects" ON public.projects FOR SELECT TO authenticated USING (public.is_project_member(id));
CREATE POLICY "Users create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (created_by = (SELECT auth.uid()));
CREATE POLICY "Owners update project" ON public.projects FOR UPDATE TO authenticated USING (public.has_project_role(id, ARRAY['owner', 'admin']::public.project_role[]));

-- Policies for Project Members
CREATE POLICY "Members view team" ON public.project_members FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Admins manage team" ON public.project_members FOR ALL TO authenticated USING (public.has_project_role(project_id, ARRAY['owner', 'admin']::public.project_role[]));

-- Universal Tenant Read & Write Policies
CREATE POLICY "Tenant read stores" ON public.stores FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant manage stores" ON public.stores FOR ALL TO authenticated USING (public.has_project_role(project_id, ARRAY['owner', 'admin', 'manager']::public.project_role[]));

CREATE POLICY "Tenant read categories" ON public.product_categories FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant manage categories" ON public.product_categories FOR ALL TO authenticated USING (public.has_project_role(project_id, ARRAY['owner', 'admin', 'manager', 'inventory_manager']::public.project_role[]));

CREATE POLICY "Tenant read products" ON public.products FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant manage products" ON public.products FOR ALL TO authenticated USING (public.has_project_role(project_id, ARRAY['owner', 'admin', 'manager', 'inventory_manager']::public.project_role[]));

CREATE POLICY "Tenant read inventory" ON public.inventory_balances FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant read stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant insert stock_movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Tenant read customers" ON public.customers FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_project_member(project_id));

CREATE POLICY "Tenant read invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant read invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant read payments" ON public.payments FOR SELECT TO authenticated USING (public.is_project_member(project_id));

CREATE POLICY "Tenant read print_templates" ON public.print_templates FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant manage print_templates" ON public.print_templates FOR ALL TO authenticated USING (public.has_project_role(project_id, ARRAY['owner', 'admin', 'manager']::public.project_role[]));
