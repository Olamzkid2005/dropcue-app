-- Permanent deletion is intentionally restricted to products with no orders.
-- Purchased products must remain available as immutable financial history.
CREATE OR REPLACE FUNCTION public.permanently_delete_product(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted BOOLEAN := false;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = p_product_id AND creator_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Product not found or not owned by current user';
  END IF;

  IF EXISTS (SELECT 1 FROM orders WHERE product_id = p_product_id) THEN
    RAISE EXCEPTION 'Purchased products cannot be permanently deleted; archive them instead';
  END IF;

  DELETE FROM feedback WHERE product_id = p_product_id;
  DELETE FROM files WHERE product_id = p_product_id;
  DELETE FROM products WHERE id = p_product_id;
  deleted := true;
  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.permanently_delete_product(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.permanently_delete_product(UUID) TO authenticated;
