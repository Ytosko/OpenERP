-- Migration: 202607230007_sales_tax.sql
-- Add adjustable sales tax / VAT to complete_sale (e.g. Bangladesh 15% VAT).
-- Tax is exclusive: grand_total = (subtotal - discount) + tax.
-- The rate comes from the client per sale (store setting), so each store
-- adjusts it freely in Branding & Settings.

-- Signature changes (new parameter), so drop the old overload first to avoid
-- PostgREST ambiguity between 7-arg and 8-arg versions.
DROP FUNCTION IF EXISTS public.complete_sale(UUID, UUID, UUID, JSONB, JSONB, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.complete_sale(
  p_project_id UUID,
  p_store_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_payments JSONB DEFAULT '[]'::jsonb,
  p_discount_total NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_tax_rate NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_currency TEXT;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_item JSONB;
  v_payment JSONB;
  v_product RECORD;
  v_qty NUMERIC(14, 4);
  v_unit_price NUMERIC(14, 4);
  v_line_total NUMERIC(14, 2);
  v_subtotal NUMERIC(14, 2) := 0;
  v_total_tax NUMERIC(14, 2) := 0;
  v_taxable NUMERIC(14, 2) := 0;
  v_grand_total NUMERIC(14, 2) := 0;
  v_paid_total NUMERIC(14, 2) := 0;
  v_change_total NUMERIC(14, 2) := 0;
  v_current_stock NUMERIC(14, 4);
  v_seq INT;
BEGIN
  -- 1. Identify Authenticated User
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to complete sale';
  END IF;

  -- 2. Verify Member Permission
  IF NOT public.is_project_member(p_project_id) THEN
    RAISE EXCEPTION 'User unauthorized to sell in project %', p_project_id;
  END IF;

  IF jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'Sale must contain at least one item';
  END IF;

  IF p_tax_rate < 0 OR p_tax_rate > 100 THEN
    RAISE EXCEPTION 'Tax rate must be between 0 and 100 percent';
  END IF;

  -- 3. Fetch Currency
  SELECT currency_code INTO v_currency FROM public.projects WHERE id = p_project_id;
  IF v_currency IS NULL THEN
    v_currency := 'USD';
  END IF;

  -- 4. Generate Invoice Number
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_seq FROM public.invoices WHERE project_id = p_project_id;
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_seq::TEXT, 5, '0');
  v_invoice_id := gen_random_uuid();

  -- 5. Compute Payments Total
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    v_paid_total := v_paid_total + (v_payment->>'amount')::NUMERIC;
  END LOOP;

  -- 6. Insert Invoice Header FIRST so invoice_items/stock_movements FKs resolve
  INSERT INTO public.invoices (
    id, project_id, store_id, customer_id, invoice_number, status, payment_status, currency_code,
    subtotal, discount_total, tax_total, grand_total, paid_total, change_total, notes, created_by
  ) VALUES (
    v_invoice_id, p_project_id, p_store_id, p_customer_id, v_invoice_number, 'completed', 'paid', v_currency,
    0, COALESCE(p_discount_total, 0), 0, 0, v_paid_total, 0, p_notes, v_user_id
  );

  -- 7. Items Loop
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::NUMERIC;
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero';
    END IF;

    SELECT * INTO v_product FROM public.products
    WHERE id = (v_item->>'product_id')::UUID AND project_id = p_project_id;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_product.sales_price);
    v_line_total := ROUND(v_qty * v_unit_price, 2);
    v_subtotal := v_subtotal + v_line_total;

    -- Inventory Deduction
    IF v_product.track_stock THEN
      SELECT quantity INTO v_current_stock FROM public.inventory_balances
      WHERE store_id = p_store_id AND product_id = v_product.id
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        v_current_stock := 0;
      END IF;

      INSERT INTO public.inventory_balances (project_id, store_id, product_id, quantity, updated_at)
      VALUES (p_project_id, p_store_id, v_product.id, -v_qty, NOW())
      ON CONFLICT (store_id, product_id)
      DO UPDATE SET quantity = inventory_balances.quantity - v_qty, updated_at = NOW();

      INSERT INTO public.stock_movements (
        project_id, store_id, product_id, movement_type, quantity_delta, unit_cost, reference_id, note, created_by
      ) VALUES (
        p_project_id, p_store_id, v_product.id, 'sale', -v_qty, v_product.cost_price, v_invoice_id, 'POS Sale ' || v_invoice_number, v_user_id
      );
    END IF;

    -- Insert Invoice Item Snapshot
    INSERT INTO public.invoice_items (
      project_id, invoice_id, product_id, sku_snapshot, name_snapshot, quantity, unit_price, line_total
    ) VALUES (
      p_project_id, v_invoice_id, v_product.id, v_product.sku, v_product.name, v_qty, v_unit_price, v_line_total
    );
  END LOOP;

  -- 8. Finalize Totals: tax applies to the discounted subtotal (exclusive VAT)
  v_taxable := ROUND(v_subtotal - COALESCE(p_discount_total, 0), 2);
  IF v_taxable < 0 THEN
    v_taxable := 0;
  END IF;
  v_total_tax := ROUND(v_taxable * COALESCE(p_tax_rate, 0) / 100, 2);
  v_grand_total := v_taxable + v_total_tax;

  IF v_paid_total > v_grand_total THEN
    v_change_total := v_paid_total - v_grand_total;
  END IF;

  UPDATE public.invoices
  SET subtotal = v_subtotal,
      tax_total = v_total_tax,
      grand_total = v_grand_total,
      change_total = v_change_total
  WHERE id = v_invoice_id;

  -- 9. Insert Payments
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    INSERT INTO public.payments (
      project_id, invoice_id, method, amount, received_by
    ) VALUES (
      p_project_id, v_invoice_id, COALESCE(v_payment->>'method', 'CASH'), (v_payment->>'amount')::NUMERIC, v_user_id
    );
  END LOOP;

  -- 10. Audit Record
  INSERT INTO public.audit_logs (
    project_id, actor_user_id, action, entity_type, entity_id, metadata
  ) VALUES (
    p_project_id, v_user_id, 'COMPLETE_SALE', 'invoices', v_invoice_id::TEXT,
    jsonb_build_object('invoice_number', v_invoice_number, 'total', v_grand_total, 'tax', v_total_tax, 'tax_rate', p_tax_rate)
  );

  RETURN jsonb_build_object(
    'id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'subtotal', v_subtotal,
    'tax_total', v_total_tax,
    'grand_total', v_grand_total,
    'paid_total', v_paid_total,
    'change_total', v_change_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale TO authenticated;
