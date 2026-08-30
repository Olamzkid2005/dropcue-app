-- =============================================
-- 005 — Index for webhook order lookups
--
-- Stripe/Bachs webhooks look orders up by provider_session_id on every
-- payment event. Without an index that is a full table scan per webhook,
-- which degrades linearly as the orders table grows.
-- =============================================

CREATE INDEX IF NOT EXISTS idx_orders_provider_session_id ON orders(provider_session_id);
