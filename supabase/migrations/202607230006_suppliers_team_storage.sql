-- Migration: 202607230006_suppliers_team_storage.sql
-- Suppliers & purchase orders, team invite helper, and store-assets storage bucket.

-- 1. Suppliers Table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supplier_code TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, supplier_code)
);

CREATE INDEX suppliers_project_id_idx ON public.suppliers(project_id);

-- 2. Purchase Orders Table (items snapshot as JSONB lines)
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{product_id, name, quantity, unit_cost}]
  total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ,
  UNIQUE (project_id, po_number)
);

CREATE INDEX purchase_orders_project_id_idx ON public.purchase_orders(project_id);

-- RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (public.has_project_role(project_id, ARRAY['owner', 'admin', 'manager', 'inventory_manager']::public.project_role[]));

CREATE POLICY "Tenant read purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "Tenant manage purchase_orders" ON public.purchase_orders FOR ALL TO authenticated USING (public.has_project_role(project_id, ARRAY['owner', 'admin', 'manager', 'inventory_manager']::public.project_role[]));

-- 3. Receive Purchase Order atomically: stock in + ledger + status flip
CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_po_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_po RECORD;
  v_item JSONB;
  v_qty NUMERIC(14, 4);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF v_po.id IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF NOT public.has_project_role(
    v_po.project_id,
    ARRAY['owner', 'admin', 'manager', 'inventory_manager']::public.project_role[]
  ) THEN
    RAISE EXCEPTION 'User unauthorized to receive stock in this project';
  END IF;

  IF v_po.status = 'received' THEN
    RAISE EXCEPTION 'Purchase order % is already received', v_po.po_number;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_po.items)
  LOOP
    v_qty := (v_item->>'quantity')::NUMERIC;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.inventory_balances (project_id, store_id, product_id, quantity, updated_at)
    VALUES (v_po.project_id, v_po.store_id, (v_item->>'product_id')::UUID, v_qty, NOW())
    ON CONFLICT (store_id, product_id)
    DO UPDATE SET quantity = inventory_balances.quantity + v_qty, updated_at = NOW();

    INSERT INTO public.stock_movements (
      project_id, store_id, product_id, movement_type, quantity_delta, unit_cost, reference_id, note, created_by
    ) VALUES (
      v_po.project_id, v_po.store_id, (v_item->>'product_id')::UUID, 'purchase', v_qty,
      NULLIF(v_item->>'unit_cost', '')::NUMERIC, v_po.id, 'PO Receive ' || v_po.po_number, v_user_id
    );
  END LOOP;

  UPDATE public.purchase_orders
  SET status = 'received', received_at = NOW()
  WHERE id = p_po_id;

  RETURN jsonb_build_object('po_number', v_po.po_number, 'status', 'received');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.receive_purchase_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order(UUID) TO authenticated;

-- 4. Invite existing user to project by email
-- (True email invitations need the service role + SMTP; this adds an
--  already-registered account to the team, which fits the in-app flow.)
CREATE OR REPLACE FUNCTION public.invite_member_by_email(
  p_project_id UUID,
  p_email TEXT,
  p_role public.project_role DEFAULT 'cashier'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_target_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_project_role(p_project_id, ARRAY['owner', 'admin']::public.project_role[]) THEN
    RAISE EXCEPTION 'Only owners and admins can invite team members';
  END IF;

  IF p_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot grant the owner role via invitation';
  END IF;

  SELECT id INTO v_target_id FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No account found for %. Ask them to sign up first, then invite them.', p_email;
  END IF;

  INSERT INTO public.project_members (project_id, user_id, role, status)
  VALUES (p_project_id, v_target_id, p_role, 'active')
  ON CONFLICT (project_id, user_id)
  DO UPDATE SET role = EXCLUDED.role, status = 'active';

  RETURN jsonb_build_object('user_id', v_target_id, 'role', p_role);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.invite_member_by_email(UUID, TEXT, public.project_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_member_by_email(UUID, TEXT, public.project_role) TO authenticated;

-- 5. Team listing helper (profiles + membership + email from auth.users)
CREATE OR REPLACE FUNCTION public.list_team_members(p_project_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role public.project_role,
  status TEXT,
  joined_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pm.user_id,
         u.email::TEXT,
         COALESCE(NULLIF(p.full_name, ''), u.email::TEXT) AS full_name,
         pm.role,
         pm.status,
         pm.joined_at
  FROM public.project_members pm
  JOIN auth.users u ON u.id = pm.user_id
  LEFT JOIN public.profiles p ON p.id = pm.user_id
  WHERE pm.project_id = p_project_id
    AND public.is_project_member(p_project_id)
  ORDER BY pm.joined_at;
$$;

REVOKE EXECUTE ON FUNCTION public.list_team_members(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_team_members(UUID) TO authenticated;

-- 6. Storage bucket for store assets (logos, receipt images) — public read
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Object paths are namespaced by project id: store-assets/{project_id}/...
CREATE POLICY "Members upload store assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-assets'
    AND public.is_project_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Members update store assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND public.is_project_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Members delete store assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND public.is_project_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Public read store assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'store-assets');
