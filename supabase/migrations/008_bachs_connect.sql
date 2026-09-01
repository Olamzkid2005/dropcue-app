-- =============================================
-- Migration 008: Bachs Connect (creator payout architecture)
-- =============================================
-- Model: direct charges. Each sale is charged to the creator's own Bachs
-- connected account (X-Account-Id) and the platform fee is split back to
-- the platform by Bachs. The platform never holds creator funds.
--
-- Policy: on a full refund, Dropcue voluntarily returns its platform fee
-- to the creator via a transfer (POST /v1/transfers, platform -> account).

-- ── Creators: Bachs Connect account linkage ──
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS bachs_account_id TEXT;

-- not_started | pending | active
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS bachs_onboarding_status TEXT NOT NULL DEFAULT 'not_started';

CREATE INDEX IF NOT EXISTS idx_creators_bachs_account_id
  ON creators(bachs_account_id)
  WHERE bachs_account_id IS NOT NULL;

-- ── Orders: direct-charge attribution ──
-- Platform fee kept by Dropcue on this sale (kobo). Bachs reports the
-- settled fee separately via GET /v1/platform_fees for reconciliation.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS platform_fee_amount INTEGER;

-- Bachs charge id (ch_...) captured from the checkout.completed webhook;
-- ties refunds (refund.paid carries charge_id) back to the order.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS provider_charge_id TEXT;

-- The creator Bachs account this direct charge landed in.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS bachs_account_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_provider_charge_id
  ON orders(provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;
