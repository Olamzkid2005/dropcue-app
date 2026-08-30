-- =============================================
-- 004 — Atomic download counting + server-only table lockdown
-- =============================================

-- 1) Atomic download count increment.
--    Replaces the read-modify-write pattern (read count → JS +1 → write),
--    which loses increments when two downloads race concurrently.
--    Guarded: refuses to increment past max_downloads. Returns the new
--    count, or NULL if the limit was already reached (no update happened).

CREATE OR REPLACE FUNCTION public.increment_delivery_downloads(p_delivery_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE deliveries
  SET download_count = download_count + 1
  WHERE id = p_delivery_id
    AND download_count < max_downloads
  RETURNING download_count INTO new_count;

  RETURN new_count;
END;
$$;

-- Server-only function: never callable by browser clients
REVOKE EXECUTE ON FUNCTION public.increment_delivery_downloads(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_delivery_downloads(UUID) TO service_role;

-- 2) Lock down server-only tables.
--    The previous policies used USING (true) with no TO clause, which made
--    deliveries / email_deliveries / audit_logs readable AND writable by
--    ANY anon or authenticated client via the REST API (including delivery
--    tokens inside deliveries). All app code accesses these tables via the
--    service role only — verified — so access is now restricted to it.

DROP POLICY IF EXISTS "service_role_manages_deliveries" ON deliveries;
CREATE POLICY "service_role_only_deliveries"
  ON deliveries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manages_email_deliveries" ON email_deliveries;
CREATE POLICY "service_role_only_email_deliveries"
  ON email_deliveries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manages_audit_logs" ON audit_logs;
CREATE POLICY "service_role_only_audit_logs"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
