# Dropcue

Sell and deliver digital products securely. Creators upload files, set a price, and share a link. Buyers pay and download instantly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS |
| Database | Supabase PostgreSQL (with RLS) |
| File Storage | Supabase Storage (private, signed URLs) |
| Auth | Supabase Auth (magic link + Google/Apple OAuth) |
| Payments | Bachs.io (primary) + Stripe (optional) |
| Email | Resend |
| Testing | Puppeteer |

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd dropcue-app
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon` key
   - `service_role` key (keep this secret)
3. Go to **SQL Editor** and run the migration:
   ```sql
   -- Paste the ordered contents of supabase/migrations/*.sql
   ```
4. Go to **Storage** and create a bucket named `products` (private)

### 3. Set up Bachs.io (payments)

1. Sign up at [bachs.io](https://bachs.io)
2. Go to **Developer Portal → API Keys** and create a secret key
3. Go to **Webhooks** and add an endpoint:
   - URL: `https://your-domain.com/api/webhooks/bachs`
   - Events: `collection.succeeded`
4. Copy the signing secret

### 4. Set up Resend (email)

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your domain (or use their test domain for development)

### 5. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Supabase Auth
SUPABASE_JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Bachs.io
BACHS_SECRET_KEY=sk_sandbox_...
BACHS_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin (receives feedback notifications)
ADMIN_EMAIL=your@email.com
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── auth/login/               # Magic link + social login
│   ├── auth/callback/            # OAuth callback handler
│   ├── (creator)/                # Protected creator routes
│   │   ├── page.tsx              # Dashboard (products list)
│   │   └── products/
│   │       ├── new/              # Create product
│   │       └── [id]/             # Product detail + file upload
│   ├── p/[publicId]/             # Public product page (buyer-facing)
│   ├── payment/success/          # Payment success + polling
│   ├── download/[token]/         # Secure download page
│   ├── setup/                    # Database setup wizard
│   └── api/
│       ├── checkout/[productId]/ # Create checkout session
│       ├── upload/               # Generate signed upload URL
│       ├── upload/complete/      # Mark upload complete
│       ├── files/[fileId]/       # Delete file
│       ├── delivery/[token]/     # Resolve delivery token
│       ├── orders/[orderId]/     # Order status polling
│       ├── webhooks/bachs/       # Bachs.io webhook
│       ├── webhooks/stripe/      # Stripe webhook
│       ├── feedback/             # Submit feedback
│       └── setup/                # DB status + migration
├── components/                   # React components
│   ├── nav.tsx                   # Navigation bar
│   ├── feedback/                 # Floating feedback button
│   ├── products/                 # Product cards, file upload
│   └── checkout/                 # Checkout form
├── lib/                          # Shared utilities
│   ├── supabase/                 # Client, server, admin clients
│   ├── security/                 # Rate limiting, headers, tokens
│   ├── audit/                    # Audit logging
│   ├── email/                    # Resend client
│   ├── storage/                  # Supabase Storage adapter
│   └── errors.ts                 # Error handling
└── modules/                      # Feature modules
    ├── auth/                     # Auth types, actions, queries
    ├── products/                 # Product CRUD, validations
    ├── files/                    # File upload, validations
    ├── payments/                 # Bachs.io + Stripe adapters
    ├── orders/                   # Order creation, fulfillment
    ├── delivery/                 # Token resolution, signed URLs
    ├── notifications/            # Email templates, actions
    └── feedback/                 # Feedback submission
```

## How It Works

### Creator Flow

1. **Sign in** — Magic link or Google/Apple OAuth
2. **Create product** — Name, description, price (NGN)
3. **Upload files** — Drag & drop, up to 500MB each, 10 files max
4. **Share link** — `/p/[publicId]` — copy, WhatsApp, Telegram
5. **Get paid** — Buyer pays, you get a notification

### Buyer Flow

1. **Open link** — See product name, price, description
2. **Enter email** — One field, no account needed
3. **Pay** — Redirected to Bachs.io hosted checkout
4. **Download** — After payment, get a secure download link (24h expiry)

### Security

- **RLS** — Database-level authorization, never trust the browser
- **Signed URLs** — File downloads use 10-minute expiring URLs
- **Idempotent webhooks** — Duplicate payments are impossible
- **Rate limiting** — All API endpoints are rate-limited
- **Audit logging** — Every important event is tracked

## Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `SUPABASE_JWT_SECRET` | ❌ | Not used by the current app |
| `NEXT_PUBLIC_SITE_URL` | ✅ | App URL for auth redirects |
| `BACHS_SECRET_KEY` | ✅ | Bachs.io API key (`sk_sandbox_...` or `sk_live_...`) |
| `BACHS_WEBHOOK_SECRET` | ✅ | Bachs.io webhook signing secret |
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key (optional provider) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ | Stripe publishable key |
| `RESEND_API_KEY` | ❌ | Resend API key for purchase emails |
| `NEXT_PUBLIC_APP_URL` | ✅ | App URL for email links |
| `ADMIN_EMAIL` | ❌ | Receives feedback notification emails |

## Testing

The repository contains browser smoke and staging-only payment/load tests. They require a running dev server and a browser executable configured for the current machine. Run only the test that matches the change being verified.

## Deployment

### Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm run start
```

## Design System

- **Colors**: Accent indigo `#4338CA`, surface canvas `#F1F5F9`
- **Fonts**: Geist (headlines), Inter (body)
- **Icons**: Material Symbols Outlined
- **Spacing**: 8px base grid

## License

Private — All rights reserved.
