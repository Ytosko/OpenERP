-- Migration: 202607230004_bootstrap_functions.sql
-- Onboarding bootstrap: project creation, product creation with opening stock, demo catalog seed.
-- These are SECURITY DEFINER because RLS intentionally blocks the first-member insert
-- (a brand-new project has no members yet, so the client cannot insert the owner row itself).

-- 1. Create Project + Owner Membership + Default Store atomically
CREATE OR REPLACE FUNCTION public.create_project_with_defaults(
  p_name TEXT,
  p_business_type TEXT DEFAULT 'retail',
  p_currency TEXT DEFAULT 'USD',
  p_store_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_store_id UUID;
  v_slug TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a project';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Store name is required';
  END IF;

  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(gen_random_uuid()::text, 1, 6);

  INSERT INTO public.projects (name, slug, business_type, currency_code, created_by)
  VALUES (trim(p_name), v_slug, COALESCE(p_business_type, 'retail'), COALESCE(p_currency, 'USD'), v_user_id)
  RETURNING id INTO v_project_id;

  INSERT INTO public.project_members (project_id, user_id, role, status)
  VALUES (v_project_id, v_user_id, 'owner', 'active');

  INSERT INTO public.stores (project_id, name, code, is_default)
  VALUES (v_project_id, COALESCE(NULLIF(trim(p_store_name), ''), trim(p_name)), 'MAIN', true)
  RETURNING id INTO v_store_id;

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'store_id', v_store_id,
    'slug', v_slug
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_project_with_defaults(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_project_with_defaults(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 2. Add Product + Opening Stock (inventory_balances has no client-side write policy by design)
CREATE OR REPLACE FUNCTION public.add_product_with_opening_stock(
  p_project_id UUID,
  p_store_id UUID,
  p_sku TEXT,
  p_name TEXT,
  p_barcode TEXT DEFAULT NULL,
  p_unit TEXT DEFAULT 'item',
  p_sales_price NUMERIC DEFAULT 0,
  p_cost_price NUMERIC DEFAULT 0,
  p_track_stock BOOLEAN DEFAULT true,
  p_low_stock_threshold NUMERIC DEFAULT 5,
  p_opening_qty NUMERIC DEFAULT 0,
  p_category_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_product_id UUID;
  v_category_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_project_role(
    p_project_id,
    ARRAY['owner', 'admin', 'manager', 'inventory_manager']::public.project_role[]
  ) THEN
    RAISE EXCEPTION 'User unauthorized to manage products in project %', p_project_id;
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Product name is required';
  END IF;
  IF p_sku IS NULL OR length(trim(p_sku)) = 0 THEN
    RAISE EXCEPTION 'Product SKU is required';
  END IF;

  IF p_category_name IS NOT NULL AND length(trim(p_category_name)) > 0 THEN
    INSERT INTO public.product_categories (project_id, name)
    VALUES (p_project_id, trim(p_category_name))
    ON CONFLICT (project_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_category_id;
  END IF;

  INSERT INTO public.products (
    project_id, category_id, sku, barcode, name, unit,
    sales_price, cost_price, track_stock, low_stock_threshold
  ) VALUES (
    p_project_id, v_category_id, trim(p_sku), NULLIF(trim(COALESCE(p_barcode, '')), ''), trim(p_name), COALESCE(p_unit, 'item'),
    COALESCE(p_sales_price, 0), COALESCE(p_cost_price, 0), COALESCE(p_track_stock, true), COALESCE(p_low_stock_threshold, 5)
  )
  RETURNING id INTO v_product_id;

  IF COALESCE(p_track_stock, true) AND COALESCE(p_opening_qty, 0) > 0 THEN
    INSERT INTO public.inventory_balances (project_id, store_id, product_id, quantity, updated_at)
    VALUES (p_project_id, p_store_id, v_product_id, p_opening_qty, NOW())
    ON CONFLICT (store_id, product_id)
    DO UPDATE SET quantity = inventory_balances.quantity + EXCLUDED.quantity, updated_at = NOW();

    INSERT INTO public.stock_movements (
      project_id, store_id, product_id, movement_type, quantity_delta, unit_cost, note, created_by
    ) VALUES (
      p_project_id, p_store_id, v_product_id, 'opening', p_opening_qty, p_cost_price, 'Opening stock', v_user_id
    );
  END IF;

  RETURN jsonb_build_object('product_id', v_product_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_product_with_opening_stock(UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, BOOLEAN, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_product_with_opening_stock(UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, BOOLEAN, NUMERIC, NUMERIC, TEXT) TO authenticated;

-- 3. Seed Demo Catalog (12 commercial demo products) for a freshly onboarded project
CREATE OR REPLACE FUNCTION public.seed_demo_catalog(
  p_project_id UUID,
  p_store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_row RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT public.has_project_role(p_project_id, ARRAY['owner', 'admin']::public.project_role[]) THEN
    RAISE EXCEPTION 'User unauthorized to seed catalog in project %', p_project_id;
  END IF;

  FOR v_row IN
    SELECT * FROM (VALUES
      ('COF-101', '8901001', 'Double Espresso 12oz',                  'Coffee',      'cup',  3.75,   0.60, false, 0,   0),
      ('COF-102', '8901002', 'Oat Milk Latte 16oz',                   'Coffee',      'cup',  5.50,   1.20, false, 0,   0),
      ('BAK-201', '8902001', 'Fresh Butter Croissant',                'Bakery',      'item', 4.25,   1.10, true,  10,  24),
      ('BAK-202', '8902002', 'Chocolate Almond Muffin',               'Bakery',      'item', 4.50,   1.25, true,  5,   3),
      ('BEV-301', '8903001', 'Cold Brew Coffee 16oz',                 'Beverages',   'cup',  4.95,   0.90, false, 0,   0),
      ('MER-401', '8904001', 'Ethiopia Whole Bean 250g',              'Merchandise', 'bag',  18.50,  8.00, true,  6,   8),
      ('ELE-501', '8905001', 'Wireless Thermal Label Printer',        'Electronics', 'unit', 149.99, 85.00, true, 3,   12),
      ('ELE-502', '8905002', 'Handheld 2D Laser Barcode Scanner',     'Electronics', 'unit', 69.50,  32.00, true, 3,   18),
      ('SUP-601', '8906001', '80mm Thermal Receipt Paper (Box of 50)','Supplies',    'box',  45.00,  22.00, true, 5,   40),
      ('SUP-602', '8906002', '4x6 Shipping Label Rolls (Roll of 500)','Supplies',    'roll', 28.75,  12.50, true, 10,  65),
      ('BEV-302', '8903002', 'Organic Matcha Green Tea Latte',        'Beverages',   'cup',  5.75,   1.40, false, 0,   0),
      ('BAK-203', '8902003', 'Artisan Blueberry Scone',               'Bakery',      'item', 3.95,   0.95, true,  5,   15)
    ) AS t(sku, barcode, name, category, unit, sales_price, cost_price, track_stock, low_threshold, opening_qty)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.products WHERE project_id = p_project_id AND sku = v_row.sku
    ) THEN
      PERFORM public.add_product_with_opening_stock(
        p_project_id, p_store_id, v_row.sku, v_row.name, v_row.barcode, v_row.unit,
        v_row.sales_price, v_row.cost_price, v_row.track_stock, v_row.low_threshold,
        v_row.opening_qty, v_row.category
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('seeded', v_count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_demo_catalog(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_demo_catalog(UUID, UUID) TO authenticated;
