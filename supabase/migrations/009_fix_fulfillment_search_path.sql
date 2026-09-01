-- =============================================
-- Migration 009: fix fulfill_order_atomic gen_random_bytes visibility
-- =============================================
-- Found by tests/connect-adversarial.test.ts: fulfillment failed at runtime
-- with "function gen_random_bytes(integer) does not exist".
--
-- Cause: 007's function sets `SET search_path = public`, but on Supabase the
-- pgcrypto extension (which provides gen_random_bytes) is installed in the
-- `extensions` schema, so it was invisible inside the function. Every
-- checkout.completed / collection.succeeded webhook returned 500 and the
-- order was never fulfilled.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER FUNCTION public.fulfill_order_atomic(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  SET search_path = public, extensions;
