/**
 * Adversarial scenarios for the Bachs Connect payment architecture.
 * Reuses the payment-chaos signing pattern. Creates its own order fixtures
 * against the real database and deletes them at the end — touches no
 * pre-existing rows. No Bachs API calls are made (BACHS_SECRET_KEY is
 * intentionally unset here, so the fee-return path exercises its retry guard).
 */
import { createHmac, randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.LOADTEST_BASE_URL ?? "http://127.0.0.1:3100";
const SECRET =
  process.env.LOADTEST_WEBHOOK_SECRET ??
  process.env.BACHS_WEBHOOK_SECRET ??
  "";
if (!SECRET) throw new Error("webhook secret env is required");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function signed(body: string, timestamp = Math.floor(Date.now() / 1000).toString()) {
  return {
    "content-type": "application/json",
    "x-bachs-timestamp": timestamp,
    "x-bachs-signature": createHmac("sha256", SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex"),
  };
}

async function webhook(
  body: string,
  headers: Record<string, string> = {}
): Promise<number> {
  const res = await fetch(`${BASE}/api/webhooks/bachs`, {
    method: "POST",
    headers: { ...signed(body), ...headers },
    body,
  });
  await res.text();
  return res.status;
}

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const orderIds: string[] = [];

function completedEvent(opts: {
  eventId: string;
  sessionId: string;
  amount: string;
  chargeId: string;
  paymentStatus?: string;
}) {
  return JSON.stringify({
    id: opts.eventId,
    type: "checkout.completed",
    data: {
      checkout_id: opts.sessionId,
      status: "completed",
      payment_status: opts.paymentStatus ?? "paid",
      amount: opts.amount,
      currency: "NGN",
      charge: { id: opts.chargeId, amount: opts.amount, currency: "NGN" },
      completed_at: new Date().toISOString(),
    },
  });
}

function refundEvent(opts: {
  eventId: string;
  chargeId: string;
  refundedAmount: string;
}) {
  return JSON.stringify({
    id: opts.eventId,
    type: "refund.paid",
    data: {
      refund_id: `ref_${randomUUID().slice(0, 8)}`,
      charge_id: opts.chargeId,
      reference: "chaos_refund",
      status: "paid",
      requested_amount: opts.refundedAmount,
      refunded_amount: opts.refundedAmount,
    },
  });
}

async function makePendingOrder(
  product: { id: string; price_amount: number },
  sessionId: string
): Promise<string> {
  const id = randomUUID();
  const { error } = await supabase.from("orders").insert({
    id,
    product_id: product.id,
    public_id: randomUUID().replace(/-/g, "").slice(0, 20),
    buyer_email: `connect-chaos+${randomUUID().slice(0, 8)}@example.com`,
    amount: product.price_amount,
    currency: "NGN",
    status: "pending",
    payment_provider: "bachs",
    provider_session_id: sessionId,
    platform_fee_amount: Math.round(product.price_amount * 0.05),
    bachs_account_id: "acct_connect_test",
  });
  if (error) throw new Error(`fixture order insert failed: ${error.message}`);
  orderIds.push(id);
  return id;
}

async function cleanup() {
  if (!orderIds.length) return;
  await supabase.from("deliveries").delete().in("order_id", orderIds);
  await supabase.from("email_deliveries").delete().in("order_id", orderIds);
  await supabase.from("payment_events").delete().in("order_id", orderIds);
  await supabase.from("audit_logs").delete().in("entity_id", orderIds);
  await supabase.from("orders").delete().in("id", orderIds);
}

async function main() {
  const { data: product } = await supabase
    .from("products")
    .select("id, price_amount")
    .eq("status", "published")
    .limit(1)
    .maybeSingle();
  if (!product) throw new Error("no published product to test against");
  const naira = (product.price_amount / 100).toFixed(2);

  console.log(`Connect adversarial tests → ${BASE}`);

  /* ── 1. Checkout gating ─────────────────────────────── */
  const { count: ordersBefore } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id);

  const gateResults = await Promise.all([
    fetch(`${BASE}/api/checkout/${product.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ buyer_email: "chaos-buyer@example.com", payment_provider: "bachs" }),
    }),
    fetch(`${BASE}/api/checkout/${product.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ buyer_email: "chaos-buyer@example.com", payment_provider: "bachs" }),
    }),
  ]);
  const gateStatuses = await Promise.all(gateResults.map((r) => r.status));
  check(
    "un-onboarded creator checkout blocked (concurrent)",
    gateStatuses.every((s) => s === 400),
    `statuses=${gateStatuses.join(",")}`
  );
  const { count: ordersAfter } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id);
  check(
    "blocked checkout created no orders",
    ordersBefore === ordersAfter,
    `before=${ordersBefore} after=${ordersAfter}`
  );

  const tampered = await fetch(
    `${BASE}/api/checkout/00000000-0000-0000-0000-000000000000`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ buyer_email: "chaos@example.com", payment_provider: "bachs" }),
    }
  );
  check(
    "tampered product id → 404 not 5xx",
    tampered.status === 404,
    `HTTP ${tampered.status}`
  );

  /* ── 2. checkout.completed webhook ──────────────────── */
  // 2a. Fulfilled happy path: order paid, charge id stored, delivery created.
  const sessionA = `chk_test_${randomUUID().slice(0, 12)}`;
  const orderA = await makePendingOrder(product, sessionA);
  const chargeA = `ch_test_${randomUUID().toString().slice(0, 12)}`;
  const evtPaid = completedEvent({
    eventId: `evt_${randomUUID()}`,
    sessionId: sessionA,
    amount: naira,
    chargeId: chargeA,
  });
  const fulfillStatus = await webhook(evtPaid);
  const { data: orderARow } = await supabase
    .from("orders")
    .select("status, provider_charge_id")
    .eq("id", orderA)
    .maybeSingle();
  const { data: deliveryA } = await supabase
    .from("deliveries")
    .select("id")
    .eq("order_id", orderA)
    .maybeSingle();
  check(
    "checkout.completed fulfills order",
    fulfillStatus === 200 && orderARow?.status === "paid" && !!deliveryA,
    `HTTP ${fulfillStatus}, status=${orderARow?.status}, delivery=${!!deliveryA}`
  );
  check(
    "charge id stored for refund linking",
    orderARow?.provider_charge_id === chargeA,
    `stored=${orderARow?.provider_charge_id}`
  );

  // 2b. Duplicate event: deduped, exactly one delivery.
  const dupStatus = await webhook(evtPaid);
  const { count: deliveryCount } = await supabase
    .from("deliveries")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderA);
  check(
    "duplicate checkout.completed deduped",
    dupStatus === 200 && deliveryCount === 1,
    `HTTP ${dupStatus}, deliveries=${deliveryCount}`
  );

  // 2c. Concurrent storm of the same event: all 2xx, still one delivery.
  const storm = await Promise.all(
    Array.from({ length: 10 }, () => webhook(evtPaid))
  );
  const { count: deliveryCount2 } = await supabase
    .from("deliveries")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderA);
  check(
    "10x duplicate storm all acknowledged, one delivery",
    storm.every((s) => s >= 200 && s < 300) && deliveryCount2 === 1,
    `statuses=${storm.join(",")}, deliveries=${deliveryCount2}`
  );

  // 2d. Amount mismatch: acknowledged but NOT fulfilled.
  const sessionB = `chk_test_${randomUUID().slice(0, 12)}`;
  const orderB = await makePendingOrder(product, sessionB);
  const mismatchStatus = await webhook(
    completedEvent({
      eventId: `evt_${randomUUID()}`,
      sessionId: sessionB,
      amount: "999.00",
      chargeId: `ch_test_${randomUUID().toString().slice(0, 12)}`,
    })
  );
  const { data: orderBRow } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderB)
    .maybeSingle();
  check(
    "amount mismatch does not fulfill",
    mismatchStatus === 200 && orderBRow?.status === "pending",
    `HTTP ${mismatchStatus}, status=${orderBRow?.status}`
  );

  // 2e. Unpaid checkout.completed: acknowledged, not fulfilled.
  const sessionC = `chk_test_${randomUUID().slice(0, 12)}`;
  const orderC = await makePendingOrder(product, sessionC);
  const unpaidStatus = await webhook(
    completedEvent({
      eventId: `evt_${randomUUID()}`,
      sessionId: sessionC,
      amount: naira,
      chargeId: `ch_test_${randomUUID().toString().slice(0, 12)}`,
      paymentStatus: "pending",
    })
  );
  const { data: orderCRow } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderC)
    .maybeSingle();
  check(
    "unpaid checkout.completed does not fulfill",
    unpaidStatus === 200 && orderCRow?.status === "pending",
    `HTTP ${unpaidStatus}, status=${orderCRow?.status}`
  );

  // 2f. Invalid signature / stale timestamp on the new event type.
  const badSig = await webhook(evtPaid, { "x-bachs-signature": "00" });
  const stale = await webhook(
    completedEvent({
      eventId: `evt_${randomUUID()}`,
      sessionId: sessionA,
      amount: naira,
      chargeId: chargeA,
    }),
    signed(evtPaid, (Math.floor(Date.now() / 1000) - 301).toString())
  );
  check(
    "invalid signature + stale timestamp rejected",
    badSig === 401 && stale === 401,
    `badSig=${badSig}, stale=${stale}`
  );

  /* ── 3. Refund fee-return guards ────────────────────── */
  // 3a. Unknown charge: harmless.
  const unknownRefund = await webhook(
    refundEvent({
      eventId: `evt_${randomUUID()}`,
      chargeId: `ch_unknown_${randomUUID().toString().slice(0, 8)}`,
      refundedAmount: naira,
    })
  );
  check("refund for unknown charge harmless", unknownRefund === 200, `HTTP ${unknownRefund}`);

  // 3b. Partial refund on the fulfilled order: fee kept, 200.
  const partialStatus = await webhook(
    refundEvent({
      eventId: `evt_${randomUUID()}`,
      chargeId: chargeA,
      refundedAmount: (Number(naira) / 2).toFixed(2),
    })
  );
  const { data: partialAudit } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("event", "refund_fee_kept")
    .eq("entity_id", orderA)
    .maybeSingle();
  check(
    "partial refund keeps fee",
    partialStatus === 200 && !!partialAudit,
    `HTTP ${partialStatus}, audited=${!!partialAudit}`
  );

  // 3c. Concurrent identical partial refunds: the database claim allows one
  // audit outcome and one payment_events row. A request that collides while
  // the first claim is processing may receive 500 and will be retried by Bachs.
  const { count: partialAuditsBefore } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("event", "refund_fee_kept")
    .eq("entity_id", orderA);
  const concurrentRefundId = `evt_${randomUUID()}`;
  const concurrentRefundBody = refundEvent({
    eventId: concurrentRefundId,
    chargeId: chargeA,
    refundedAmount: (Number(naira) / 2).toFixed(2),
  });
  const concurrentStatuses = await Promise.all([
    webhook(concurrentRefundBody),
    webhook(concurrentRefundBody),
  ]);
  const { count: partialAuditsAfter } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("event", "refund_fee_kept")
    .eq("entity_id", orderA);
  const { count: concurrentPaymentEvents } = await supabase
    .from("payment_events")
    .select("id", { count: "exact", head: true })
    .eq("provider", "bachs")
    .eq("provider_event_id", concurrentRefundId);
  const concurrentAuditDelta =
    (partialAuditsAfter ?? 0) - (partialAuditsBefore ?? 0);
  check(
    "concurrent partial refunds claim once",
    concurrentStatuses.every((status) => status === 200 || status === 500) &&
      concurrentAuditDelta === 1 &&
      concurrentPaymentEvents === 1,
    `statuses=${concurrentStatuses.join(",")}, audits=${concurrentAuditDelta}, events=${concurrentPaymentEvents}`
  );

  // 3d. Full refund: transfer attempted → BACHS_SECRET_KEY unset → 500,
  //     audited as failed, NO payment_events row (retry-safe).
  const refundEvtId = `evt_${randomUUID()}`;
  const fullRefund1 = await webhook(
    refundEvent({
      eventId: refundEvtId,
      chargeId: chargeA,
      refundedAmount: naira,
    })
  );
  const fullRefund2 = await webhook(
    refundEvent({
      eventId: refundEvtId,
      chargeId: chargeA,
      refundedAmount: naira,
    })
  );
  const { count: feeEvents } = await supabase
    .from("payment_events")
    .select("id", { count: "exact", head: true })
    .eq("provider_event_id", refundEvtId);
  const { data: failAudits } = await supabase
    .from("audit_logs")
    .select("id, metadata")
    .eq("event", "refund_fee_return_failed")
    .eq("entity_id", orderA);
  const failAudit = failAudits?.find(
    (row) => (row.metadata as { provider_event_id?: string } | null)?.provider_event_id === refundEvtId
  );
  check(
    "full refund without keys → 500 (provider retries later)",
    fullRefund1 === 500,
    `HTTP ${fullRefund1}`
  );
  check(
    "redelivery stays 500, no premature payment_event, failure audited",
    fullRefund2 === 500 && feeEvents === 0 && !!failAudit,
    `redelivery=${fullRefund2}, events=${feeEvents}, audited=${!!failAudit}`
  );

  /* ── Cleanup ────────────────────────────────────────── */
  await cleanup();
  const { count: leftover } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("id", orderIds);
  console.log(`\ncleanup: ${leftover === 0 ? "✓ zero fixture rows remain" : `✗ ${leftover} rows remain!`}`);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0 || leftover !== 0) process.exit(1);
}

main()
  .catch(async (e) => {
    console.error(e);
    await cleanup();
    process.exit(1);
  });
