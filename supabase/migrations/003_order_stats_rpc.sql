-- =============================================
-- Order stats RPC — one round-trip for the orders page header stats
-- (total revenue + per-status counts), so the page never needs to
-- fetch every order just to compute totals.
--
-- SECURITY INVOKER (default): respects RLS — callers only ever see
-- their own stats, scoped via auth.uid().
-- =============================================

CREATE OR REPLACE FUNCTION public.get_creator_order_stats()
RETURNS TABLE (
  total_revenue BIGINT,
  total_orders BIGINT,
  paid_orders BIGINT,
  pending_orders BIGINT,
  failed_orders BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'paid'), 0)::BIGINT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE o.status = 'paid')::BIGINT,
    COUNT(*) FILTER (WHERE o.status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE o.status = 'failed')::BIGINT
  FROM orders o
  JOIN products pr ON pr.id = o.product_id
  WHERE pr.creator_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_order_stats() TO authenticated;
