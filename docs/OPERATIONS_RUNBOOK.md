# Dropcue Operations Runbook

## Scope

This runbook covers the minimum operational checks for a production Dropcue deployment. It does not replace Supabase, Bachs, Resend, or legal/compliance documentation.

## Health and error monitoring

- Check the application logs for `API Error`, `Bachs webhook error`, `Order fulfillment failed`, `Platform fee return failed`, and `Failed to send purchase email`.
- Treat any repeated webhook 5xx response as a payment incident: Bachs should retry, but the order must be checked before manually intervening.
- Treat a spike in failed email records as a delivery incident, not a payment failure. Purchases remain downloadable through the delivery URL.
- Keep provider request IDs, event IDs, order IDs, and timestamps in the incident record. Never record secret keys or full payment credentials.

## Payment and webhook alerts

The webhook handlers intentionally return:

- `401` for invalid or stale signatures. Investigate configuration or spoofing if this increases.
- `200` for valid duplicate, unknown, unpaid, or mismatched events. These are safely ignored and should not be retried.
- `500` for fulfillment or fee-return failures. These are retryable provider failures and require investigation.

For a launch, configure an external alert on HTTP 5xx responses for:

- `/api/webhooks/bachs`
- `/api/webhooks/stripe`
- `/api/checkout/*`

Until an error-monitoring provider is selected and configured, the application log plus Supabase audit tables are the source of truth.

## Failed email visibility

Query failed delivery records in Supabase:

```sql
select id, order_id, type, attempts, last_error, created_at
from public.email_deliveries
where status = 'failed'
order by created_at desc;
```

Purchase emails are best-effort: a failed email does not cancel a paid order. Support can provide the existing download link after verifying the order.

Audit records are also available:

```sql
select event, entity_type, entity_id, metadata, created_at
from public.audit_logs
where event in ('email_failed', 'email_sent')
order by created_at desc;
```

## Supabase backups

Before production launch:

1. Confirm the Supabase project is on a plan with the required backup and point-in-time recovery guarantees.
2. Enable the project's scheduled backups/PITR in the Supabase dashboard.
3. Record the retention period and project owner.
4. Run a restore drill in a separate staging project before launch.
5. Never test restore by dropping production tables.

Migrations remain versioned in `supabase/migrations`. Apply them in order and record the applied migration number. The current Connect/fulfillment fixes include migrations 008 and 009.

## Bachs outage procedure

### Checkout outage

If Bachs cannot create a checkout session:

1. Do not retry blindly from the browser.
2. Confirm no order was created without a usable provider session, or identify the pending order.
3. Check Bachs status and application logs.
4. Ask the buyer to retry only after the provider recovers.
5. Reconcile abandoned pending orders later; do not mark them paid manually.

### Webhook outage

If Bachs returns to service after webhook failures:

1. Confirm the webhook endpoint is reachable.
2. Confirm `BACHS_WEBHOOK_SECRET` and event source configuration.
3. Allow Bachs redelivery to process events.
4. Check `payment_events`, order status, and deliveries for the affected references.
5. Never fulfill an order from a browser redirect alone.

### Refund/fee-return outage

A full refund whose fee-return transfer fails returns 500 intentionally. Bachs should retry it. Verify the idempotency key before any manual action:

```text
feereturn_<provider_event_id>
```

Do not issue a second manual transfer unless the original transfer is confirmed absent in Bachs.

## Support procedure

For every payment or delivery ticket, collect:

- buyer email
- product public ID
- order public ID
- provider/event ID, if available
- approximate time and timezone
- screenshot or exact error text

Do not request card numbers, CVV, passwords, Supabase keys, Bachs keys, or Resend keys.

## Launch checklist

- [ ] Production secrets are configured in the hosting provider, not committed.
- [ ] Supabase migrations are applied and verified.
- [ ] Supabase backups/PITR and a restore owner are documented.
- [ ] Bachs sandbox checkout, Connect onboarding, refund, and transfer have passed.
- [ ] Webhook endpoint receives the correct Connect event source.
- [ ] Error and 5xx alerting is configured.
- [ ] Failed-email query is assigned to an owner.
- [ ] Support escalation contacts are documented.
