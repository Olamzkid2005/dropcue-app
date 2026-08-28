-- =============================================
-- DROPCUE Initial Database Schema
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Creators Table
-- =============================================
CREATE TABLE creators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creators_email ON creators(email);

-- Trigger to auto-create creator record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.creators (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Products Table
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  price_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_public_id ON products(public_id);
CREATE INDEX idx_products_creator_id ON products(creator_id);
CREATE INDEX idx_products_status ON products(status);

-- =============================================
-- Files Table
-- =============================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_product_id ON files(product_id);
CREATE INDEX idx_files_expires_at ON files(expires_at);

-- =============================================
-- Orders Table
-- =============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  public_id TEXT UNIQUE NOT NULL,
  buyer_email TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT NOT NULL,
  payment_reference TEXT,
  provider_session_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_public_id ON orders(public_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX idx_orders_status ON orders(status);

-- =============================================
-- Payment Events Table (for idempotency)
-- =============================================
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  payload_hash TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_provider_event_id ON payment_events(provider, provider_event_id);

-- =============================================
-- Deliveries Table
-- =============================================
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  delivery_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_delivery_token ON deliveries(delivery_token);
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);

-- =============================================
-- Email Deliveries Table
-- =============================================
CREATE TABLE email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_deliveries_order_id ON email_deliveries(order_id);
CREATE INDEX idx_email_deliveries_status ON email_deliveries(status);

-- =============================================
-- Feedback Table
-- =============================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES creators(id),
  email TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  page_url TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- =============================================
-- Audit Logs Table
-- =============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Creators: users can only read/update their own profile
CREATE POLICY "creators_manage_own_profile"
ON creators FOR ALL
USING (id = auth.uid());

-- Products: creators manage their own products
CREATE POLICY "creators_manage_own_products"
ON products FOR ALL
USING (creator_id = auth.uid());

-- Products: public read access for published products (for checkout page)
CREATE POLICY "public_can_view_published_products"
ON products FOR SELECT
USING (status = 'published');

-- Files: creators manage files for their own products
CREATE POLICY "creators_manage_own_files"
ON files FOR ALL
USING (
  product_id IN (
    SELECT id FROM products WHERE creator_id = auth.uid()
  )
);

-- Orders: creators see orders for their products
CREATE POLICY "creators_view_own_orders"
ON orders FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE creator_id = auth.uid()
  )
);

-- Deliveries: no direct user access (handled via API with delivery token)
CREATE POLICY "service_role_manages_deliveries"
ON deliveries FOR ALL
USING (true);

-- Email deliveries: service role only
CREATE POLICY "service_role_manages_email_deliveries"
ON email_deliveries FOR ALL
USING (true);

-- Feedback: anyone can insert, creators view own
CREATE POLICY "anyone_can_insert_feedback"
ON feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "creators_view_own_feedback"
ON feedback FOR SELECT
USING (
  user_id = auth.uid() OR
  product_id IN (
    SELECT id FROM products WHERE creator_id = auth.uid()
  )
);

-- Audit logs: service role only
CREATE POLICY "service_role_manages_audit_logs"
ON audit_logs FOR ALL
USING (true);

-- =============================================
-- Helper Functions
-- =============================================

-- Function to check if a product is purchasable
CREATE OR REPLACE FUNCTION is_product_purchasable(product_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_valid_price BOOLEAN;
  has_uploaded_files BOOLEAN;
  is_not_archived BOOLEAN;
BEGIN
  SELECT
    (price_amount > 0),
    (status != 'archived')
  INTO has_valid_price, is_not_archived
  FROM products
  WHERE id = product_uuid;

  SELECT EXISTS (
    SELECT 1 FROM files
    WHERE product_id = product_uuid
    AND status = 'uploaded'
  ) INTO has_uploaded_files;

  RETURN has_valid_price AND has_uploaded_files AND is_not_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
