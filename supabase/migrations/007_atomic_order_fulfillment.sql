CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Atomic payment fulfillment: claim the order, create delivery, and record
-- the webhook event in one transaction.
CREATE OR REPLACE FUNCTION public.fulfill_order_atomic(
  p_order_id UUID,
  p_payment_reference TEXT,
  p_provider_session_id TEXT,
  p_provider_event_id TEXT,
  p_provider TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS TABLE (
  delivery_token TEXT,
  buyer_email TEXT,
  product_name TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order RECORD;
  new_token TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM payment_events
    WHERE provider = p_provider
      AND provider_event_id = p_provider_event_id
  ) THEN
    RETURN;
  END IF;

  SELECT o.id, o.status, o.buyer_email, p.name AS product_name
  INTO current_order
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE o.id = p_order_id
  FOR UPDATE OF o;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF current_order.status <> 'pending' THEN
    RETURN;
  END IF;

  UPDATE orders
  SET status = 'paid',
      payment_reference = p_payment_reference,
      provider_session_id = p_provider_session_id,
      paid_at = NOW()
  WHERE id = p_order_id;

  new_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO deliveries (
    order_id,
    delivery_token,
    status,
    expires_at
  )
  VALUES (
    p_order_id,
    new_token,
    'active',
    p_expires_at
  );

  INSERT INTO payment_events (
    provider,
    provider_event_id,
    event_type,
    order_id,
    payload_hash
  )
  VALUES (
    p_provider,
    p_provider_event_id,
    'paid',
    p_order_id,
    p_payment_reference
  );

  RETURN QUERY SELECT
    new_token,
    current_order.buyer_email,
    current_order.product_name,
    p_expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_order_atomic(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_order_atomic(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  TO service_role;
