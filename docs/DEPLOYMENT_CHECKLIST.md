# Dropcue Production Deployment Checklist

Use this checklist for each production release. Do not place secret values in this file or in Git.

## 1. Release readiness

- [ ] Confirm the target commit is on the intended branch.
- [ ] Review the diff for unrelated files, debug code, screenshots, and secrets.
- [ ] Confirm `.env.local` and other local environment files are ignored by Git.
- [ ] Run `npm install`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build` while no local development server is using `.next`.
- [ ] Run the relevant existing test suites against the intended environment.
- [ ] Record the commit SHA being deployed.

## 2. Supabase production setup

- [ ] Confirm the correct production Supabase project is selected.
- [ ] Apply every file in `supabase/migrations/` in numeric order.
- [ ] Record the highest migration applied.
- [ ] Verify these tables exist:
  - [ ] `creators`
  - [ ] `products`
  - [ ] `files`
  - [ ] `orders`
  - [ ] `payment_events`
  - [ ] `deliveries`
  - [ ] `email_deliveries`
  - [ ] `feedback`
  - [ ] `audit_logs`
- [ ] Confirm the `products` storage bucket exists and is private.
- [ ] Confirm RLS policies are enabled and creator ownership is enforced.
- [ ] Enable the required Supabase backups/PITR.
- [ ] Record the restore owner and retention period.
- [ ] Rotate any credential that has been exposed or shared.

## 3. Vercel configuration

- [ ] Import or connect the GitHub repository in Vercel.
- [ ] Confirm the framework is detected as Next.js.
- [ ] Confirm the build command is `npm run build`.
- [ ] Add production environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_APP_URL
BACHS_SECRET_KEY
BACHS_WEBHOOK_SECRET
RESEND_API_KEY
ADMIN_EMAIL
```

- [ ] Add Stripe variables only if Stripe is enabled:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

- [ ] Confirm server-only secrets are not prefixed with `NEXT_PUBLIC_`.
- [ ] Confirm the production domain is used instead of `localhost`.
- [ ] Configure distributed rate limiting for Vercel before enabling live checkout; the current in-memory limiter is not sufficient across serverless instances.
- [ ] Deploy the intended commit.
- [ ] If a stale build is suspected, redeploy with the build cache disabled once.

## 4. Authentication configuration

In Supabase **Authentication → URL Configuration**:

- [ ] Set the Site URL to `https://<production-domain>`.
- [ ] Add `https://<production-domain>/auth/callback` as a redirect URL.
- [ ] Confirm the password-reset redirect uses the production domain.
- [ ] If enabled, configure Google and Apple OAuth with production callback URLs.
- [ ] Test magic-link login.
- [ ] Test OAuth login.
- [ ] Test sign-out and session persistence.
- [ ] Test forgot-password and reset-password flows.

## 5. Bachs payment configuration

- [ ] Confirm the Bachs account is approved for production use.
- [ ] Configure the production/live secret key in Vercel.
- [ ] Configure the production webhook signing secret in Vercel.
- [ ] Register:

```text
https://<production-domain>/api/webhooks/bachs
```

- [ ] Enable `collection.succeeded` for legacy/platform-level payments.
- [ ] Enable `checkout.completed` for Bachs Connect direct charges.
- [ ] Enable the relevant `refund.*` events, including `refund.paid` for settled refunds.
- [ ] Confirm the webhook source and signing-secret configuration match.
- [ ] Confirm the provider return URL uses the production app URL.
- [ ] Complete one small sandbox transaction before switching to live mode.
- [ ] Verify one live transaction only after all sandbox checks pass.
- [ ] Verify duplicate webhook delivery does not duplicate orders or deliveries.
- [ ] Verify refund handling and fee-return behavior.

## 6. Resend email configuration

- [ ] Verify the production sending domain in Resend.
- [ ] Create a production API key.
- [ ] Configure `RESEND_API_KEY` in Vercel.
- [ ] Configure `ADMIN_EMAIL` for feedback notifications.
- [ ] Send a test purchase email.
- [ ] Send a test feedback notification.
- [ ] Confirm failed emails are visible in `email_deliveries`.
- [ ] Confirm a failed email does not mark a paid order as unpaid.

## 7. Post-deploy smoke tests

Set the deployed URL:

```bash
export BASE_URL="https://<production-domain>"
```

- [ ] Check health:

```bash
curl -i "$BASE_URL/api/health"
```

Expected result: HTTP `200` with healthy Supabase, webhook-secret, and app-URL checks.

- [ ] Open the marketing homepage.
- [ ] Open `/how-it-works`, `/pricing`, and `/security`.
- [ ] Confirm `/dashboard` redirects unauthenticated users to login.
- [ ] Log in and confirm the dashboard loads.
- [ ] Create a test product.
- [ ] Upload a permitted file.
- [ ] Confirm the product becomes purchasable only after a valid upload.
- [ ] Open the public `/p/<public-id>` page.
- [ ] Confirm `/p/does-not-exist` returns the designed 404 page, not a 500.
- [ ] Complete a sandbox checkout.
- [ ] Confirm the webhook marks the order paid.
- [ ] Confirm one delivery is created.
- [ ] Open the download page and download the file.
- [ ] Confirm an invalid or expired token cannot download files.
- [ ] Confirm the order appears on the creator orders page.
- [ ] Submit feedback and confirm the admin notification arrives.

## 8. Observability and support

- [ ] Configure alerts in Vercel or the chosen monitoring provider for 5xx responses on:
  - [ ] `/api/checkout/*`
  - [ ] `/api/webhooks/bachs`
  - [ ] `/api/webhooks/stripe`
- [ ] Confirm an alert test reaches the responsible owner.
- [ ] Confirm application logs are accessible to the owner.
- [ ] Confirm payment event IDs, order IDs, provider references, and timestamps are retained in incident records.
- [ ] Never record payment credentials, passwords, or secret keys in logs.
- [ ] Assign an owner for failed-email review.
- [ ] Assign an owner for payment/webhook incidents.
- [ ] Keep the support procedure in `docs/OPERATIONS_RUNBOOK.md` available to the team.

## 9. Rollback and completion

- [ ] Record the deployed Vercel deployment URL and commit SHA.
- [ ] Watch application, checkout, webhook, and email errors after release.
- [ ] If a rollback is needed, use the previous known-good Vercel deployment.
- [ ] Do not manually mark orders paid from a browser redirect.
- [ ] Do not rerun migrations by editing already-applied migration files.
- [ ] Confirm the production deployment is stable before announcing it.

## Release record

```text
Release date:
Commit SHA:
Vercel deployment:
Highest migration applied:
Verified by:
Notes:
```
