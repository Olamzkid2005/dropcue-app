-- =============================================
-- Dashboard stats RPC — single round-trip for dashboard statistics
--
-- Replaces multi-query client-side aggregation on /dashboard:
--   • total_revenue   — SUM of ALL paid orders (fixes bug where only the
--                       10 most recent orders were summed)
--   • total_orders    — exact count of ALL orders (fixes bug where the
--                       count was capped at the 10 fetched rows)
--   • total_products / active_products — creator product counts
--   • recent_orders   — the 10 most recent orders, with product name
--
-- SECURITY INVOKER (default): respects RLS — callers can only ever see
-- their own stats, scoped via auth.uid().
-- =============================================

CREATE OR REPLACE FUNCTION public.get_creator_stats()
RETURNS TABLE (
  total_revenue BIGINT,
  total_orders BIGINT,
  total_products BIGINT,
  active_products BIGINT,
  recent_orders JSONB
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'paid'), 0)::BIGINT,
    COUNT(o.id)::BIGINT,
    (SELECT COUNT(*) FROM products pr
      WHERE pr.creator_id = auth.uid())::BIGINT,
    (SELECT COUNT(*) FROM products pr
      WHERE pr.creator_id = auth.uid() AND pr.status = 'published')::BIGINT,
    COALESCE((
      SELECT JSONB_AGG(to_jsonb(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT o.id, o.buyer_email, o.amount, o.status, o.created_at,
               pr2.name AS product_name
        FROM orders o
        JOIN products pr2 ON pr2.id = o.product_id
        WHERE pr2.creator_id = auth.uid()
        ORDER BY o.created_at DESC
        LIMIT 10
      ) t
    ), '[]'::JSONB)
  FROM orders o
  JOIN products pr ON pr.id = o.product_id
  WHERE pr.creator_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_stats() TO authenticated;
