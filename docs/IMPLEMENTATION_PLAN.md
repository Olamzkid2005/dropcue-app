# Secure Digital Product Delivery Platform (DROPCUE)- MVP Implementation Plan

## Confirmed Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js 14+ (App Router) + TypeScript |
| UI Components | shadcn/ui + Tailwind CSS |
| Database | Supabase PostgreSQL |
| Object Storage | Supabase Storage (private) |
| Auth | Supabase Auth (magic link for creators) |
| Payments | Stripe + Korapay (behind provider interface) |
| Email | Resend |
| Deployment | Vercel |

### Authentication Model

- **Creators**: Email + magic link via Supabase Auth (invisible onboarding)
- **Buyers**: No accounts; email only during checkout
- **Ownership**: `creator_id` foreign key links products to authenticated creators

---

## Critical Guardrails (Non-Negotiable)

### 1. Authorization & Row Level Security

**Rule:** Never trust `creator_id` from the browser.

Server-side auth derives ownership from session. Supabase RLS as second line of defense.

```sql
-- Products RLS
CREATE POLICY "creators_manage_own_products"
ON products FOR ALL
USING (creator_id = auth.uid());

-- Files RLS
CREATE POLICY "creators_manage_own_files"
ON files FOR ALL
USING (
  product_id IN (
    SELECT id FROM products WHERE creator_id = auth.uid()
  )
);

-- Orders RLS (creators see orders for their products)
CREATE POLICY "creators_view_own_orders"
ON orders FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE creator_id = auth.uid()
  )
);
```

**Every API route must:**
1. Get creator from server-side session
2. Query by creator_id
3. Never accept creator_id from request body

### 2. File Security Chain

```text
/download/:token
   ↓
Validate token exists + not expired
   ↓
Resolve: token → delivery → order → product → files
   ↓
Verify file hasn't reached retention expiration
   ↓
Generate short-lived signed Supabase Storage URL
   ↓
Buyer downloads
```

**Never expose:**
- Permanent storage URLs
- Raw storage keys
- Files from other orders/products

**Token must not be modifiable to access different files.**

### 3. Explicit State Machines

**Order States:**
```text
pending_payment → paid → completed
                  ↓
                failed
                  ↓
                refunded
```

**Delivery States:**
```text
pending → ready → expired
```

**Email States:**
```text
pending → sending → sent
                ↓
              failed → retry
```

**Never assume:** `order.paid` means `delivery.ready` or `email.sent`. Check each state independently.

### 4. Download Page States

**Processing:**
> We're confirming your payment...
> This usually takes a few seconds.

**Delayed:**
> Your payment is taking a little longer to confirm.
> You don't need to pay again. We'll email you when your files are ready.

**Ready:**
> Summer Nights
> Payment successful ✓
> Your files are ready.
> • Summer Nights.wav
> • Summer Nights MP3.zip
> Download all files
> Download link expires: 24 Aug 2026, 3:42 PM

**Expired:**
> This download link has expired.
> Contact the seller for help accessing your purchase.

**Files unavailable:**
> These files are no longer available for download.
> The seller's file-retention period has ended.

### 5. Creator Dashboard Summary

```text
Products: 8
Orders: 42
Revenue: ₦350,000
```

Not analytics. Basic operational information.

### 6. Audit Logging

Log important events for debugging:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,  -- product_created, payment_received, etc.
  entity_type TEXT NOT NULL,  -- product, order, delivery
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Events to log:**
- product_created
- product_archived
- product_deleted
- payment_received
- delivery_created
- download_requested
- email_sent
- email_failed

### 7. Retention Communication

When creator archives a sold product, show:

> Existing customers can continue downloading their purchase until the file retention period ends. After that, the files are permanently deleted.

Make retention date visible when appropriate.

---

## Creator Dashboard Scope

### Creator Home Page

```text
Good afternoon, David

[ + Create product ]

Products
────────────────────────────────
Summer Nights      ₦15,000
Published          [Copy link]

Late Night         ₦10,000
Published          [Copy link]

Orders
────────────────────────────────
Summer Nights      ₦15,000
Paid               Today

Late Night         ₦10,000
Pending            Yesterday
```

### Core Creator Actions

1. **Create** — Create a product and upload files
2. **Manage** — See products they've already created
3. **Share** — Copy/retrieve the share link
4. **Confirm sales** — See whether an order was paid

### What NOT to Build

- Analytics dashboard
- Revenue charts
- Conversion tracking
- Customer CRM
- Payout dashboard
- Advanced reporting
- Marketing tools
- Team collaboration
- Settings pages

The payment provider remains the source of truth for settlement. Our dashboard is the source of truth for products and orders.

---

## Project Structure

```
beat-delivery/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Marketing pages (optional later)
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # Magic link login page
│   │   │   ├── callback/route.ts     # Auth callback handler
│   │   │   └── layout.tsx            # Auth pages layout
│   │   ├── (creator)/                # Creator app pages (protected)
│   │   │   ├── layout.tsx            # Creator layout with auth check
│   │   │   ├── page.tsx              # Dashboard/home
│   │   │   ├── products/
│   │   │   │   ├── new.tsx           # Create product
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Product detail
│   │   │   │       └── success.tsx   # Product created confirmation
│   │   │   └── orders/
│   │   │       └── page.tsx          # Orders list (minimal)
│   │   ├── p/[publicId]/             # Public checkout page
│   │   ├── checkout/
│   │   │   └── [productId]/          # Checkout session
│   │   ├── payment/
│   │   │   ├── success/              # Payment success page
│   │   │   └── failed/               # Payment failed page
│   │   ├── download/[token]/         # Secure download page
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts    # Send magic link
│   │   │   │   └── callback/route.ts # Auth callback
│   │   │   ├── products/
│   │   │   │   └── route.ts
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # Upload URL generation
│   │   │   ├── checkout/
│   │   │   │   └── [productId]/
│   │   │   │       └── route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/route.ts
│   │   │   │   └── korapay/route.ts
│   │   │   └── delivery/
│   │   │       └── [token]/
│   │   │           └── files/
│   │   │               └── [fileId]/
│   │   │                   └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts        # Auth server actions
│   │   │   │   └── queries.ts        # Creator queries
│   │   │   ├── types.ts
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── products/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts        # Server actions
│   │   │   │   └── queries.ts        # Database queries
│   │   │   ├── types.ts
│   │   │   └── validations.ts        # Zod schemas
│   │   ├── files/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   └── storage.ts        # Supabase Storage adapter
│   │   │   ├── types.ts
│   │   │   └── validations.ts
│   │   ├── payments/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── stripe.ts         # Stripe adapter
│   │   │   │   ├── korapay.ts        # Korapay adapter
│   │   │   │   └── provider.ts       # Provider interface
│   │   │   ├── types.ts
│   │   │   └── validations.ts
│   │   ├── orders/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   └── queries.ts
│   │   │   ├── types.ts
│   │   │   └── validations.ts
│   │   ├── delivery/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   └── tokens.ts        # Token generation/validation
│   │   │   ├── types.ts
│   │   │   └── validations.ts
│   │   └── notifications/
│   │       ├── server/
│   │       │   ├── actions.ts
│   │       │   └── email.ts          # Resend adapter
│   │       ├── types.ts
│   │       └── templates/
│   │           ├── purchase-ready.tsx   # Payment + download access
│   │           └── magic-link.tsx       # Creator authentication
│   │   └── feedback/
│   │       ├── server/
│   │       │   ├── actions.ts
│   │       │   └── queries.ts
│   │       ├── types.ts
│   │       └── components/
│   │           └── feedback-button.tsx  # Floating feedback button
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client (with auth)
│   │   │   └── admin.ts              # Service role client
│   │   ├── payments/
│   │   │   ├── types.ts              # PaymentProvider interface
│   │   │   └── index.ts              # Provider factory
│   │   ├── storage/
│   │   │   └── index.ts              # Storage helpers
│   │   ├── email/
│   │   │   └── index.ts              # Resend client
│   │   ├── security/
│   │   │   ├── tokens.ts             # High-entropy token generation
│   │   │   ├── rate-limit.ts         # Rate limiting
│   │   │   └── validation.ts         # Input validation helpers
│   │   ├── audit/
│   │   │   └── index.ts              # Audit logging helpers
│   │   └── errors.ts                 # Error handling
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── auth/
│   │   │   ├── magic-link-form.tsx   # Email input + send magic link
│   │   │   └── auth-status.tsx       # Current auth state display
│   │   ├── products/
│   │   │   ├── create-product-form.tsx
│   │   │   ├── file-upload.tsx
│   │   │   └── product-card.tsx
│   │   ├── checkout/
│   │   │   ├── checkout-page.tsx
│   │   │   └── payment-button.tsx
│   │   └── delivery/
│   │       └── download-page.tsx
│   └── types/
│       └── database.ts               # Generated Supabase types
├── supabase/
│   └── migrations/
├── public/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schema (PostgreSQL via Supabase)

### Creators Table

```sql
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
```

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL,  -- High-entropy public identifier (12+ chars)
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,  -- Optional product image for OG previews
  price_amount INTEGER NOT NULL,  -- Amount in smallest currency unit (kobo)
  currency TEXT NOT NULL DEFAULT 'NGN',  -- ISO 4217 (NGN only for V1)
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, published, archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_public_id ON products(public_id);
CREATE INDEX idx_products_creator_id ON products(creator_id);
```

### Product Status Lifecycle

```text
Product created
  → draft

File upload starts
  → file = uploading

File upload completes
  → file = uploaded

Backend evaluates product
  → valid price + ≥1 file with status = uploaded?
      YES → published
      NO  → draft

Published product loses its last valid file
  → no checkout allowed (still published, but checkout fails)

Creator archives product
  → archived
  → stops new purchases
  → existing paid orders remain downloadable
```

### File Upload Limits (V1)

| Limit | Value | Purpose |
|-------|-------|---------|
| Max file size | 500 MB | Per individual file |
| Max files/product | 10 | Per product |
| Max total product size | 2 GB | Sum of all files |

**These are configurable limits, not architectural constraints.**

Enforcement happens at:
1. Frontend (user feedback)
2. Backend API (rejection before upload)
3. Supabase Storage (final guard)

**Backend must enforce even if frontend is bypassed.**

### Allowed MIME Types (V1)

```
Audio:
  audio/wav
  audio/mpeg
  audio/flac
  audio/aac
  audio/mp4

Images:
  image/jpeg
  image/png
  image/webp
  image/tiff

Documents:
  application/pdf

Archives:
  application/zip
  application/x-7z-compressed
  application/x-rar-compressed
```

**Explicitly rejected:**
```
.exe, .dmg, .pkg, .apk, .sh, .bat, .cmd
```

**Security Note:** MIME type from browser is not trustworthy. Backend validates:
- File extension
- Declared MIME type
- File size
- Upload state

Server-side file signature detection can be added later for higher-risk formats.

**Business Invariant (server-side enforced):**

A product is purchasable ONLY when ALL conditions are true:
1. Has a valid price (> 0)
2. Has at least one file with status = `uploaded`
3. Status is NOT `archived`

This evaluation happens server-side on every checkout attempt. The frontend never determines sellability.

**Archiving Rule:**

Archiving stops NEW purchases but does NOT revoke existing paid orders. Buyers who already paid retain their download access.

### Product Deletion & File Retention

```text
ACTIVE
  ↓
ARCHIVED (by creator)
  ↓
No new purchases
Existing buyers retain access
  ↓
Retention period expires (30 days)
  ↓
Files permanently deleted from storage
```

**Delete vs Archive:**

| Product State | Creator Clicks Delete | Result |
|---------------|----------------------|--------|
| No orders | Permanent delete | Remove DB records + storage files |
| Has paid orders | Archive | Stop sales, retain files for retention period |

**File Retention Policy:**

- Archived product → files remain for 30 days (configurable)
- Existing buyers can still download during retention period
- After retention expires → files permanently deleted from Supabase Storage
- Database purchase/payment history retained permanently (for auditing)

**Download Token vs File Expiration:**

```text
Purchase
   ↓
Download token valid for 24 hours
   ↓
Token expires
   ↓
Buyer can request support for new token
   ↓
Product files remain until retention expires
   ↓
File retention expires
   ↓
Supabase Storage files deleted permanently
```

**Cleanup Job:**

```sql
-- Find expired files
SELECT * FROM files WHERE expires_at <= NOW();

-- Delete Supabase Storage objects
-- Delete file records
```

Database records (orders, payments, deliveries) remain permanently for auditing.

### Files Table

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_key TEXT NOT NULL,  -- Supabase Storage object path
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,  -- Bytes
  status TEXT NOT NULL DEFAULT 'uploading',  -- uploading, uploaded, failed
  expires_at TIMESTAMPTZ,  -- NULL = active, set when product archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_product_id ON files(product_id);
CREATE INDEX idx_files_expires_at ON files(expires_at);
```

### Feedback Table

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES creators(id),  -- NULL for anonymous buyers
  email TEXT,  -- Optional, for follow-up
  category TEXT NOT NULL,  -- 'broken', 'confusing', 'feature_request', 'general'
  message TEXT NOT NULL,
  page_url TEXT NOT NULL,  -- Current page URL
  product_id UUID REFERENCES products(id),  -- NULL if not product-related
  order_id UUID REFERENCES orders(id),  -- NULL if not order-related
  user_agent TEXT,  -- Browser/device info
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
```

### Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  public_id TEXT UNIQUE NOT NULL,  -- High-entropy order identifier
  buyer_email TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- Amount paid
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, paid, failed, refunded
  payment_provider TEXT NOT NULL,  -- stripe, korapay
  payment_reference TEXT,  -- Provider's payment reference
  provider_session_id TEXT,  -- Checkout session ID
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_public_id ON orders(public_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX idx_orders_status ON orders(status);
```

### Payment Events Table

```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,  -- stripe, korapay
  provider_event_id TEXT UNIQUE NOT NULL,  -- Webhook event ID for idempotency
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  payload_hash TEXT NOT NULL,  -- SHA-256 of raw payload for verification
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_provider_event_id ON payment_events(provider, provider_event_id);
```

### Deliveries Table

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  delivery_token TEXT UNIQUE NOT NULL,  -- High-entropy token for download access
  status TEXT NOT NULL DEFAULT 'active',  -- active, expired, revoked
  expires_at TIMESTAMPTZ NOT NULL,  -- Token expiration
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_delivery_token ON deliveries(delivery_token);
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
```

---

## Core Module Interfaces

### Money Model

```typescript
// src/lib/money/types.ts

export interface Money {
  amount: number;  // Smallest currency unit (kobo for NGN)
  currency: string; // ISO 4217
}

// V1: NGN only
export const SUPPORTED_CURRENCIES = ['NGN'] as const;

export function createMoney(amount: number, currency: string = 'NGN'): Money {
  if (!SUPPORTED_CURRENCIES.includes(currency as any)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return { amount, currency };
}

export function formatDisplayPrice(money: Money): string {
  // Display as ₦5,000 (human-readable)
  const naira = money.amount / 100;
  return `₦${naira.toLocaleString('en-NG')}`;
}

export function parseCreatorInput(nairaAmount: number): Money {
  // Creator enters 5000, we store 500000 kobo
  const kobo = Math.round(nairaAmount * 100);
  return createMoney(kobo, 'NGN');
}
```

### Payment Provider Interface

```typescript
// src/modules/payments/server/provider.ts

export interface Money {
  amount: number;  // Smallest currency unit (kobo for NGN)
  currency: string; // ISO 4217
}

export interface PaymentProvider {
  name: string;
  
  /**
   * Convert our internal Money format to the provider's expected amount.
   * Stripe: uses smallest unit (kobo) - pass through as-is
   * Korapay: uses whole units (e.g., 5000 for ₦5,000) - divide by 100
   */
  formatAmount(money: Money): number | string;
  
  createCheckoutSession(params: {
    orderId: string;
    amount: Money;
    product_name: string;
    buyer_email?: string;
    success_url: string;
    cancel_url: string;
    webhook_url: string;
  }): Promise<{
    session_id: string;
    checkout_url: string;
  }>;
  
  verifyWebhook(
    payload: unknown,
    headers: Headers
  ): Promise<WebhookVerificationResult>;
  
  /**
   * Verify transaction directly with provider.
   * Required for Korapay ( Charge Query API ).
   * Optional for Stripe (webhook signature sufficient).
   */
  verifyTransaction(paymentReference: string): Promise<VerifiedTransaction>;
  
  /**
   * Parse webhook payload into standardized payment event.
   */
  parseWebhook(payload: unknown): PaymentEvent;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event?: PaymentEvent;
  error?: string;
}

export interface VerifiedTransaction {
  status: 'success' | 'failed' | 'pending';
  amount: Money;
  currency: string;
  reference: string;
}

export interface PaymentEvent {
  type: 'paid' | 'failed' | 'refunded';
  provider_event_id: string;
  payment_reference: string;
  amount: Money;
}

// src/lib/payments/index.ts

import { StripeProvider } from './stripe';
import { KorapayProvider } from './korapay';

export function getPaymentProvider(provider: string): PaymentProvider {
  switch (provider) {
    case 'stripe':
      return new StripeProvider();
    case 'korapay':
      return new KorapayProvider();
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}
```

### Korapay Adapter (V1)

**Checkout Flow:**

```text
POST /api/checkout/:productId
   ↓
Create order (status: pending)
   ↓
POST /api/payments/korapay/create
   ↓
Korapay Initialize API
   ↓
Redirect to hosted checkout
   ↓
Buyer completes payment
   ↓
redirect_url → success page
   ↓
"Confirming your payment..."
   ↓
Korapay webhook → backend
```

**Webhook Event:** `charge.success` (NOT `charge.successful`)

**Signature Verification:**

```text
HMAC-SHA256(
    JSON.stringify(webhook.data),
    KORAPAY_SECRET_KEY
) == x-korapay-signature
```

**Transaction Verification:**

```text
GET /merchant/api/v1/charges/:reference

Response includes:
- reference
- status
- amount
- amount_paid
- currency
```

**Amount Conversion:**

```text
Internal (database):  500000 (kobo)
Display:              ₦5,000
Korapay API:          5000 (whole units)
```

**Webhook Handling:**

```text
Webhook received
   ↓
Verify HMAC signature
   Invalid → return 4xx
   ↓
Parse event type
   charge.success → continue
   Other → return 200
   ↓
Get payment reference
   ↓
Call Korapay Charge Query API
   ↓
Verify transaction:
   status = success
   currency matches
   amount matches
   ↓
DB transaction
   ├─ lock order
   ├─ mark paid
   ├─ create delivery
   └─ record event
   ↓
COMMIT
   ↓
Return 200
   ↓
Email job (async)
```

**Payment Channels (V1):**
- Card
- Bank transfer
- Pay with Bank

**Webhook Retries:**
- Korapay retries for up to 72 hours
- Non-200 responses trigger retries
- Always return 200 for valid webhooks (even if processing fails)
- Use idempotency to prevent duplicate fulfillment

### Storage Interface

```typescript
// src/lib/storage/index.ts

export interface StorageProvider {
  generateUploadUrl(
    bucket: string,
    path: string,
    options?: { content_type?: string; expires_in?: number }
  ): Promise<{ upload_url: string; path: string }>;
  
  generateDownloadUrl(
    bucket: string,
    path: string,
    options?: { expires_in?: number }
  ): Promise<{ download_url: string }>;
  
  deleteFile(bucket: string, path: string): Promise<void>;
  
  getFileInfo(bucket: string, path: string): Promise<{
    size: number;
    content_type: string;
  } | null>;
}
```

---

## Share Link & OG Metadata

### Share Link Format

```text
/p/[publicId]
```

Full URL: `https://yourdomain.com/p/abc123XYZ`

- System-generated, opaque, high-entropy
- No custom slugs in V1
- Short enough for WhatsApp/Telegram sharing

### After Product Creation

Redirect to product detail/share page:

```text
Product
Summer Nights

₦15,000
Published

Share link
┌─────────────────────────────────────┐
│ https://yourdomain.com/p/abc123  [📋] │
└─────────────────────────────────────┘

[ WhatsApp ] [ Telegram ] [ Copy ]
```

### Share Actions

- **Copy Link** — Always available, primary action
- **WhatsApp** — Opens WhatsApp with pre-filled message
- **Telegram** — Opens Telegram with pre-filled message
- **Native share** — Where supported (mobile browsers)

### OG Metadata (Server-Side Rendered)

Every public product page generates Open Graph metadata:

```html
<meta property="og:title" content="Summer Nights — Premium Beat" />
<meta property="og:description" content="Buy securely and download instantly" />
<meta property="og:image" content="https://yourdomain.com/og?product=abc123" />
<meta property="og:url" content="https://yourdomain.com/p/abc123" />
<meta property="og:type" content="product" />
<meta property="product:price:amount" content="15000" />
<meta property="product:price:currency" content="NGN" />
```

**What to include:**
- Product name
- Description
- Price
- Creator/brand name
- Product image (or default branded image)

**What NOT to include:**
- Buyer information
- Email addresses
- Private file information
- Storage URLs
- Delivery tokens

### Product Image Handling

- Optional `cover_image_url` field on product
- If no image: use default branded product image
- Image used for OG previews and product page
- Recommended size: 1200x630px (OG standard)

---

## Feedback System (V1)

### Purpose

Collect real user feedback during pilot validation. Not a support system — a product validation tool.

### UI Component

Persistent, unobtrusive "Feedback" button on:
- Creator dashboard
- Product pages
- Checkout page
- Success page
- Download page

**Feedback Modal:**

```text
How is your experience?

[ Something is broken ]
[ Something is confusing ]
[ Feature request ]
[ Just give feedback ]

Tell us more...
[________________________]

Optional email
[________________________]

           Send feedback
```

### Data Captured Automatically

```sql
feedback
├── id
├── user_id                 -- NULL for anonymous buyers
├── email                   -- Optional, for follow-up
├── category                -- broken, confusing, feature_request, general
├── message                 -- User's feedback text
├── page_url                -- Current page URL
├── product_id              -- NULL if not product-related
├── order_id                -- NULL if not order-related
├── user_agent              -- Browser/device info
└── created_at
```

### Admin Notification

Email notification on new feedback:

```text
New feedback received

Category: Something is broken
Message: "Download button doesn't work..."

Page: /download/...
Order: ORD_12345
```

### What NOT to Build (V1)

- Feedback analytics dashboard
- Sentiment analysis
- Voting systems
- Public feature requests
- Complex ticket management
- Feedback workflows
- Response tracking

V1 = lightweight in-app feedback collection + admin email notification.

---

## Email Architecture (Resend + React Email)

### Email Templates

**V1 has two email templates:**

1. **Purchase + Download** — Combined receipt + download access
2. **Magic Link** — Creator authentication

### Purchase + Download Email

```text
Subject: Your files are ready!

Hey,

Your payment for "Summer Nights" was successful.

[Download your files]

This download link expires in 24 hours.

Payment reference: KPY-123456

Thanks,
Your App
```

### Magic Link Email

```text
Subject: Sign in to Your App

Click below to sign in:

[Sign in]

This link expires in 15 minutes.
```

### Email Delivery Tracking

```sql
CREATE TABLE email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  type TEXT NOT NULL,  -- 'purchase_ready', 'magic_link'
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, sending, sent, failed
  provider_id TEXT,  -- Resend message ID
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_deliveries_order_id ON email_deliveries(order_id);
CREATE INDEX idx_email_deliveries_status ON email_deliveries(status);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,  -- product_created, payment_received, etc.
  entity_type TEXT NOT NULL,  -- product, order, delivery
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Email Flow

```text
Payment confirmed
      ↓
DB transaction (order paid + delivery created)
      ↓
COMMIT
      ↓
Create email_deliveries record
      ↓
Queue email job
      ↓
React Email template
      ↓
Resend API
      ↓
┌─────┴─────┐
Sent       Failed
 ↓           ↓
Done        Retry (exponential backoff)
```

### Email Rate Limiting

| Email Type | Trigger | Rate Limit |
|------------|---------|------------|
| Purchase + Download | Successful payment | None (transactional) |
| Magic Link | Creator login | 3 per email per 15 min |
| Download resend | User request | 5 per email per hour |

### Key Guarantees

1. **Authorization** — RLS + server-side session, never trust browser-provided creator_id
2. **File security** — Token → delivery → order → product → files chain
3. **State machines** — Order, delivery, email states tracked independently
4. **Idempotent payments** — Database-level uniqueness, row locking
5. **Atomic fulfillment** — DB transaction for payment + delivery + event
6. **Signed downloads** — Short-lived URLs, no permanent storage exposure
7. **Retention cleanup** — Automated deletion after retention period
8. **Contextual feedback** — Page, product, order, user context captured
9. **Audit logging** — Important events tracked for debugging
10. **Retention communication** — Creators informed about file deletion

---

## Core API Endpoints

### Product Endpoints

```typescript
POST /api/products
Body: { name, description, price, currency }
Response: { product_id, public_id, share_url }

GET /api/products/:id
Response: { product, files[] }
```

### Upload Endpoints

```typescript
POST /api/upload
Body: { product_id, file_name, file_size, content_type }
Response: { upload_url, file_id, storage_key }

POST /api/upload/complete
Body: { file_id, product_id }
Response: { success, file }
```

### Checkout Endpoints

```typescript
POST /api/checkout/:productId
Body: { buyer_email, payment_provider }
Response: { checkout_url, session_id }
```

### Checkout Flow

```text
Public product page (p/[publicId])
   ↓
Buyer sees: product name, price, description
   ↓
Buyer enters email (one field)
   ↓
Frontend validates email format
   ↓
POST /api/checkout/:productId
   ↓
Backend validates:
   - Product exists and is purchasable (price + files + not archived)
   - Email is valid
   - Payment provider is supported
   ↓
Backend creates Order (status: pending, buyer_email persisted)
   ↓
Backend creates checkout session with payment provider
   ↓
Payment provider checkout URL returned
   ↓
Buyer redirected to payment provider
   ↓
Buyer completes payment
   ↓
Payment provider webhook → our backend
```

### Webhook Endpoints

```typescript
POST /api/webhooks/stripe
POST /api/webhooks/korapay
Body: Raw webhook payload with signature headers
Response: 200 OK (always, even on errors for webhook reliability)
```

### Delivery Endpoints

```typescript
GET /api/delivery/:token
Response: { order, product, files[], expires_at }

GET /api/delivery/:token/files/:fileId
Response: { download_url, expires_in }

GET /api/delivery/:token/status
Response: { status: 'pending' | 'paid' | 'failed' }
```

---

## Buyer Delivery Flow (Complete Sequence)

```text
Buyer pays
   ↓
Payment provider processes payment
   ↓
Provider webhook → our backend
   ↓
Verify signature + payment details
   ↓
Order = PAID (server-side only)
   ↓
Create delivery record with delivery_token
   ↓
Send email with delivery token URL
   ↓
Buyer sees success page
```

### Success Page Behavior

```text
Payment Success page loads
   ↓
Frontend polls /api/delivery/:token/status
   ↓
Backend checks order status
   ↓
If status = 'pending':
   → Show "We're confirming your payment…"
   → Keep polling
If status = 'paid':
   → Show "Download files" button
   → Stop polling
If status = 'failed':
   → Show "Payment could not be confirmed"
   → Show support contact
```

**Critical Rule:** The frontend NEVER decides access. Only backend-confirmed `paid` status enables the download button.

### Download Mechanism

```text
Buyer clicks "Download files"
   ↓
GET /api/delivery/:token
   ↓
Backend validates:
   - Token exists
   - Token not expired
   - Order status = paid
   - Download count < max_downloads
   ↓
Generate short-lived signed Supabase Storage URL
   ↓
Return download URL to frontend
   ↓
Browser downloads file from signed URL
```

### Token Expiration Policy

| Token Type | Lifetime | Purpose |
|------------|----------|---------|
| Delivery token | 24 hours (configurable) | Overall access window |
| Signed storage URL | 5-15 minutes (configurable) | Individual download |

- Delivery token controls the access window
- Each download request generates a fresh short-lived signed URL
- Delivery token can be reused within the window (not single-use)
- Download count tracked but not strictly limited in V1

### Email Backup

Email contains:
- Payment confirmation
- Product name
- "Download your files" button with delivery URL
- Expiration notice

If email fails:
- Purchase is NOT rolled back
- Order remains paid
- Buyer can still download from current session
- Log notification failure for retry later

---

## Security Implementation

### Token Generation

```typescript
// src/lib/security/tokens.ts

import { randomBytes } from 'crypto';

export function generateHighEntropyToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function generatePublicId(): string {
  // URL-friendly, 12+ characters, collision-resistant
  // Use base64url for shorter, more readable IDs
  return randomBytes(9).toString('base64url'); // 12 chars
}

export function generateDeliveryToken(): string {
  // Delivery tokens need even higher entropy
  return randomBytes(32).toString('hex'); // 64 chars
}
```

### Rate Limiting

```typescript
// src/lib/security/rate-limit.ts

const rateLimitStore = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.reset) {
    rateLimitStore.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}
```

### Webhook Verification

```typescript
// Must verify signatures before processing
// Never trust unsigned payloads
// Store provider_event_id for idempotency
// Always return 200 to provider
```

### Webhook Processing Sequence

```text
POST /api/webhooks/:provider
        │
        ├─ Verify signature
        │   Invalid → return 4xx, log, stop
        │
        ├─ Ignore unsupported event types → return 200
        │
        ├─ Extract provider_event_id
        │
        ├─ Check idempotency (UNIQUE constraint on payment_events)
        │   Already processed → return 200, stop
        │
        ├─ Find order by provider_session_id
        │   Not found → log error, return 200, stop
        │
        ├─ Validate amount/currency/status match
        │   Mismatch → log warning, return 200, don't fulfill
        │
        └─ BEGIN TRANSACTION
              │
              ├─ Lock order (SELECT ... FOR UPDATE)
              │
              ├─ Check order status (already paid? skip)
              │
              ├─ Mark order paid (status = 'paid', paid_at = NOW())
              │
              ├─ Create delivery record + token
              │
              ├─ Record payment event (provider_event_id)
              │
              └─ COMMIT
                       │
                       ├──────────────→ return 200
                       │
                       ↓
                 Queue/send email (async, retryable)
                       │
                 ┌─────┴─────┐
                 ↓           ↓
               sent        failed → retry
```

### Key Guarantees

1. **Idempotency enforced at database level** — UNIQUE(provider, provider_event_id)
2. **Order locked during processing** — Prevents concurrent fulfillment
3. **Email outside transaction** — Never blocks webhook response
4. **Success page reads database** — Never assumes payment from redirect
5. **Email is secondary channel** — Buyer can download even if email fails

### Order Status Lifecycle

```text
orders.status
    pending_payment  → Initial state
    paid             → Payment verified
    failed           → Payment failed
    refunded         → Payment refunded

deliveries.status
    pending          → Token created, not yet accessed
    ready            → Buyer has accessed download page
    expired          → Token expired
```

---

## Error Handling & Edge Cases

### Scenario 1: Webhook Delayed

```text
Buyer pays
   ↓
Redirected to success page
   ↓
Frontend polls /api/delivery/:token/status
   ↓
First 5 minutes:
   → Show "Confirming your payment…"
   → Poll with exponential backoff
After 5 minutes:
   → Show "Your payment is being processed. You'll receive an email once confirmed."
   → Stop polling
```

**Never tell the buyer payment failed just because webhook hasn't arrived.**

### Scenario 2: Webhook Never Arrives

```text
Order stuck in pending_payment for 15-30 minutes
   ↓
Reconciliation job checks payment provider
   ↓
Payment actually successful?
   YES → Mark paid + fulfill order
   NO  → Leave as pending
After 24 hours:
   → Manual support intervention
```

Payment providers retry webhooks. Reconciliation provides backup.

### Scenario 3: Wrong Email Address

**Before payment:**
```text
Is this email correct?
buyer@gmail.com
Your download link will be sent here.
```

**After payment (manual recovery):**
```text
payment_reference
      ↓
order
      ↓
buyer_email
      ↓
product
      ↓
delivery_token
```

Buyer contacts support with payment receipt → we locate order → update email → resend.

### Scenario 4: Product Archived After Purchase

```text
product.status = archived
   ↓
New buyer → cannot purchase
Existing buyer → can still download
```

Archiving means "stop selling," not "destroy everything."

### Scenario 5: Download Token Expires

Backend distinguishes:
- Invalid token
- Expired token
- Revoked token

Buyer sees: "Your download link has expired. Contact the seller for a new link."

### Scenario 6: Simultaneous Purchases

```text
Product
 ├── Order A
 │    └── Delivery Token A
 │
 ├── Order B
 │    └── Delivery Token B
 │
 └── Order C
      └── Delivery Token C
```

100 people can buy the same product simultaneously without collision.

### Scenario 7: Payment Succeeds, Fulfillment Fails

```text
Webhook received
      ↓
Verify webhook
      ↓
Find order by payment reference
      ↓
Already fulfilled?
   ↙          ↘
 YES           NO
 ↓             ↓
Ignore      Mark paid
              ↓
        Create delivery
              ↓
        Send email
```

If fulfillment fails, the order remains `paid` but unfulfilled. Retry mechanism can attempt fulfillment again.

### V1 Edge Case Policy

| Scenario | V1 Behavior |
|----------|-------------|
| Webhook delayed | Poll 5 min, then background processing + email |
| Webhook never arrives | Provider retries + reconciliation + support after 24h |
| Wrong email | Confirmation before payment + manual recovery |
| Product archived | No new sales, existing buyers retain access |
| Token expired | Show expiration message + contact seller |
| Concurrent purchases | Independent orders/tokens |
| Fulfillment fails | Idempotent retryable fulfillment |

---

## Buyer Checkout Page Design

### Page Layout (Mobile-First)

```text
┌─────────────────────────────────┐
│                                 │
│        Creator / Brand          │
│                                 │
│      [ Product Cover ]          │
│                                 │
│        Summer Nights            │
│                                 │
│   Premium Afrobeat Instrumental │
│                                 │
│          ₦15,000                │
│                                 │
│  Beat + stems · 4 files         │
│                                 │
│  Your files are delivered       │
│  automatically after payment.   │
│                                 │
│     [ Buy / Get the files ]     │
│                                 │
│  Secure checkout                │
│  Payment verified automatically │
│                                 │
└─────────────────────────────────┘
```

### What to Show

- Creator/brand name (not email)
- Product name
- Price (large, prominent)
- Description (if provided)
- File count + types (e.g., "Beat + stems · 4 files")
- "Files delivered automatically after payment"
- Secure checkout messaging

### What NOT to Show

- Creator email (privacy)
- Raw filenames (not useful pre-purchase)
- Download counts (out of scope)
- Reviews/ratings (out of scope)
- Fake social proof
- Complex creator profiles
- Technical storage information

### Mobile Optimization

- Primary CTA sticky near bottom on mobile
- One-handed use optimized
- Single column layout
- Large tap targets

### Trust Signals

Use factual language, not marketing fluff:
- "Secure checkout"
- "Payment verified automatically"
- "Files delivered after payment"

Avoid:
- "Military-grade security"
- "100% safe"
- "Fraud-proof"

The page's job is to take someone who already said "I want this" and remove the final reasons they might hesitate to pay.

---

## Build Order (Phased)

### Phase 1: Foundation (Day 1-2) ✅ COMPLETE
1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS + shadcn/ui
3. Set up Supabase client (browser + server + admin)
4. Configure Supabase Auth (magic link)
5. Create database schema (all tables including RLS policies)
6. Set up environment variables
7. Create base layout and navigation
8. Build auth middleware for protected routes
9. Implement audit logging helpers

### Phase 2: Creator Authentication (Day 3) ✅ COMPLETE
1. Build magic link login page
2. Implement auth server actions
3. Create auth callback handler
4. Add session management
5. Test complete auth flow

### Phase 3: Product Module (Day 3-4) ✅ COMPLETE
1. Create product validation schemas (Zod)
2. Build product creation form component
3. Implement product server actions
4. Build product list/detail pages
5. Generate public product IDs
6. Create public product page (for buyers)

### Phase 4: File Upload Module (Day 5-6) ✅ COMPLETE
1. Implement Supabase Storage integration
2. Create upload URL generation endpoint
3. Build file upload component with progress
4. Handle upload completion callback
5. Store file metadata in database
6. Implement file listing for products

### Phase 5: Payment Module (Day 7-9) ✅ COMPLETE
1. Define PaymentProvider interface
2. Implement Stripe adapter
3. Implement Korapay adapter
4. Create checkout session endpoint
5. Build checkout page UI
6. Implement webhook handlers
7. Add idempotent event processing

### Phase 6: Order & Delivery Module (Day 10-12) ✅ COMPLETE
1. Create order on checkout initiation
2. Update order status on payment webhook
3. Generate delivery tokens on payment success
4. Build secure download page
5. Implement signed URL generation for downloads
6. Add token expiration and download limits

### Phase 7: Email & Notifications (Day 13) ✅ COMPLETE
1. Set up Resend client
2. Create email templates (receipt, download access)
3. Send receipt on successful payment
4. Send download access email with secure link

### Phase 8: Security Hardening (Day 14) ✅ COMPLETE
1. Add rate limiting to all endpoints
2. Validate all inputs with Zod
3. Implement CSRF protection
4. Add security headers
5. Test unauthorized access attempts
6. Test webhook replay attacks

### Phase 9: Testing & Polish (Day 15-17) ✅ COMPLETE
1. End-to-end testing of complete flow (43/43 tests passing)
2. Error handling and edge cases verified
3. Mobile responsiveness audited (375px, 768px, 1280px)
4. Loading states verified on all interactive pages
5. Error messages tested and confirmed

---

## Critical Security Rules

1. **Never trust frontend payment status** - Always verify via webhook
2. **Private storage by default** - All files in private buckets
3. **Signed URLs only** - Time-limited, single-purpose
4. **Idempotent webhooks** - Store event IDs, process once
5. **High-entropy tokens** - 32+ bytes for delivery tokens
6. **Input validation** - Zod schemas for all endpoints
7. **Rate limiting** - Prevent abuse on all public endpoints
8. **No predictable URLs** - Use UUIDs/high-entropy IDs

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Supabase Auth
SUPABASE_JWT_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Korapay
KORAPAY_SECRET_KEY=
KORAPAY_PUBLIC_KEY=
KORAPAY_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## V1 Scope: Explicitly Deferred Features

### What We Are NOT Building

| Feature | Reason Deferred |
|---------|-----------------|
| Creator dashboard analytics | No charts, conversion tracking, revenue graphs |
| Custom branding | No custom domains, logos, colors on checkout |
| Multi-currency | NGN only for V1 |
| Buyer accounts | Email only, no login |
| Product variants | One product = one set of files |
| Discount codes | No coupons or promotions |
| Tax handling | No VAT/tax calculation |
| Payout management | Creators use Stripe/Korapay dashboards |
| Refund processing | Manual via payment provider |
| Mobile apps | Web only |
| Public API | No developer API |
| Webhooks to creators | No notifications when items sell |
| Inventory/stock | Unlimited digital copies |
| Licensing | No license keys or restrictions |
| DRM | No copy protection |
| Advanced product management | No versioning, scheduled publishing, bulk uploads, file replacement, bundles |

### V1 Scope Boundary

**BUILD:**
- Creator signup (magic link)
- Product upload
- Product page
- Checkout
- Stripe + Korapay payments
- Webhook verification
- Orders
- Delivery tokens
- Downloads
- Email delivery
- Archive/retention (fixed period)
- Basic support/recovery
- In-app feedback collection

**DO NOT BUILD:**
- Analytics
- Customization
- Buyer accounts
- Variants
- Discounts
- Taxes
- Payout automation
- Refund automation
- Apps
- API
- Creator webhooks
- Inventory
- Licensing
- DRM
- Advanced product management
- Advanced feedback/support system (ticketing, analytics, voting)

### Feature Test

For every new feature, ask:

> **Does this directly enable a creator to list a digital product, get paid, and deliver it reliably?**

If the answer is no, it belongs in V2.

### Retention Policy (V1)

```text
Product sold
→ creator archives it
→ no new purchases
→ existing buyers retain access
→ after fixed retention period (30 days)
→ files deleted
```

No creator-configurable retention. No automated policies per product. No warnings or extensions. Core behavior only.

---

## Implementation Plan Complete

### Architecture Summary

```text
Next.js App (Vercel)
├── Creator Auth (Supabase Auth - magic link)
├── Creator Dashboard (products + orders + summary)
├── Public Checkout Page (mobile-first, trust signals)
├── Success Page (polling for payment confirmation)
├── Download Page (token validation, signed URLs)
└── Feedback Button (contextual, lightweight)

API Routes
├── Products (CRUD with RLS)
├── Upload (signed URLs to Supabase Storage)
├── Checkout (Stripe + Korapay redirect)
├── Webhooks (idempotent, verified, atomic)
├── Delivery (token → order → product → files)
├── Auth (magic link)
└── Feedback (contextual capture)

Database (Supabase PostgreSQL + RLS)
├── creators (Supabase Auth linked)
├── products (creator_id FK)
├── files (product_id FK, expires_at for retention)
├── orders (product_id FK, buyer_email)
├── deliveries (order_id FK, delivery_token)
├── payment_events (provider_event_id UNIQUE)
├── email_deliveries (order_id FK, status tracking)
├── feedback (user_id nullable, contextual)
└── audit_logs (event, entity_type, entity_id)

Storage (Supabase Private Bucket)
└── No public URLs, signed URLs only

Payments
├── Stripe (redirect checkout)
└── Korapay (redirect checkout, charge.success event)

Email (Resend + React Email)
├── Purchase + Download (combined)
└── Magic Link (auth)
```

### Non-Negotiable Guardrails

1. **Authorization** — RLS + server-side session
2. **File security** — Token chain resolution
3. **State machines** — Order, delivery, email tracked independently
4. **Idempotent payments** — Database uniqueness + row locking
5. **Atomic fulfillment** — DB transaction for payment + delivery
6. **Signed downloads** — Short-lived URLs only
7. **Retention cleanup** — Automated after 30 days
8. **Audit logging** — Important events tracked
9. **Retention communication** — Creators informed about deletion

### Ready to Build

The architecture is complete. All critical decisions have been made.

**Phase 1: Foundation** starts with:
1. Next.js + TypeScript project
2. Tailwind + shadcn/ui
3. Supabase (Auth + PostgreSQL + Storage)
4. Database schema with RLS
5. Environment variables
6. Base layout
7. Auth middleware
8. Audit logging

Shall we begin?

1. ✅ Creator can upload files in under 2 minutes
2. ✅ Creator can set price and generate shareable link
3. ✅ Buyer can open link and see checkout page
4. ✅ Buyer can complete payment via Stripe or Korapay
5. ✅ Backend verifies payment via webhook
6. ✅ Buyer receives secure, time-limited download access
7. ✅ Creator does nothing after sharing link
8. ✅ System handles duplicate webhooks gracefully
9. ✅ Download links expire after configured duration
10. ✅ All files remain private until payment verified
