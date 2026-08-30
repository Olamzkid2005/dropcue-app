/**
 * Load test for the round-trip-optimized endpoints (dev server on :3000).
 *
 * Phases:
 *   A  Checkout burst        — POST /api/checkout/[id], rotating client IPs.
 *                            Exercises the fixed path: product fetch + files
 *                            count + order insert (3 round-trips). Terminates
 *                            at the payment-provider step (no keys locally)
 *                            with an expected 500 AFTER the order is created.
 *   B  Rate-limit burst      — 15 checkouts from ONE IP: first 10 pass, rest 429.
 *   C  Status hammer         — GET /api/orders/[id]/status: the polling endpoint,
 *                            1 embed round-trip since the fix (was 3 sequential).
 *   D  Webhook burst         — valid-signed Bachs events for nonexistent refs:
 *                            exercises the parallel idempotency-check + order
 *                            lookup (2 concurrent SELECTs), zero mutations.
 *   E  Fulfillment race      — N concurrent paid webhooks for ONE pending order:
 *                            detects duplicate fulfillment (deliveries created).
 *
 * Self-contained: creates fixtures, then DELETES every row it created.
 *
 * Usage:
 *   LOADTEST_WEBHOOK_SECRET=... LOADTEST_SUPABASE_URL=... LOADTEST_SERVICE_KEY=... \
 *   npx tsx tests/load-test.ts
 */

import { createHmac } from "crypto";

const BASE = process.env.LOADTEST_BASE_URL ?? "http://127.0.0.1:3000";
const WEBHOOK_SECRET = process.env.LOADTEST_WEBHOOK_SECRET ?? "";
const SB_URL = (process.env.LOADTEST_SUPABASE_URL ?? "").trim();
const SB_KEY = process.env.LOADTEST_SERVICE_KEY ?? "";
const RUN = Date.now().toString(36);

const LT_EMAIL_PREFIX = `loadtest_${RUN}`;
const RACE_EMAIL = `${LT_EMAIL_PREFIX}_race@dropcue.test`;

if (!WEBHOOK_SECRET || !SB_URL || !SB_KEY) {
  console.error("Missing LOADTEST_* env vars");
  process.exit(1);
}

/* ---------------- helpers ---------------- */

type Result = { status: number; ms: number; error?: string };

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function fakeIp(i: number): string {
  return `10.${(i >> 16) & 0xff}.${(i >> 8) & 0xff}.${i & 0xff}`;
}

async function runPhase(
  name: string,
  count: number,
  concurrency: number,
  request: (i: number) => Promise<Response>
): Promise<Result[]> {
  const results: Result[] = new Array(count);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= count) return;
      const t0 = performance.now();
      try {
        const res = await request(i);
        await res.text(); // drain to free the socket
        results[i] = { status: res.status, ms: performance.now() - t0 };
      } catch (e) {
        results[i] = { status: 0, ms: performance.now() - t0, error: String(e) };
      }
    }
  }

  const t0 = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const wall = (performance.now() - t0) / 1000;

  const byStatus = new Map<number, number>();
  const latencies: number[] = [];
  for (const r of results) {
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    latencies.push(r.ms);
  }
  latencies.sort((a, b) => a - b);
  const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log(`\n── Phase ${name} ──`);
  console.log(
    `   requests=${count} concurrency=${concurrency} wall=${wall.toFixed(2)}s ` +
      `throughput=${(count / wall).toFixed(1)} req/s`
  );
  console.log(
    `   statuses: ${[...byStatus.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([s, n]) => `${s}×${n}`)
      .join("  ")}`
  );
  console.log(
    `   latency ms: p50=${pct(latencies, 50).toFixed(0)} ` +
      `p90=${pct(latencies, 90).toFixed(0)} p95=${pct(latencies, 95).toFixed(0)} ` +
      `p99=${pct(latencies, 99).toFixed(0)} mean=${mean.toFixed(0)} ` +
      `max=${latencies[latencies.length - 1].toFixed(0)}`
  );
  const networkFailures = results.filter((r) => r.status === 0);
  if (networkFailures.length) {
    console.log(
      `   ⚠ ${networkFailures.length} network failures — sample: ${networkFailures[0].error}`
    );
  }

  return results;
}

/* Supabase REST (service role — fixtures + verification + cleanup only) */
async function sb(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function sbRows<T>(path: string, init?: RequestInit): Promise<T[]> {
  const res = await sb(path, init);
  if (!res.ok) throw new Error(`REST ${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T[]>;
}

async function sbDelete(path: string): Promise<number> {
  const res = await sb(path, { method: "DELETE", headers: { Prefer: "return=representation" } });
  if (!res.ok) throw new Error(`DELETE ${path}: ${res.status} ${await res.text()}`);
  return (await res.json() as unknown[]).length;
}

function signWebhook(body: string): Record<string, string> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHmac("sha256", WEBHOOK_SECRET).update(`${ts}.${body}`, "utf8").digest("hex");
  return { "x-bachs-timestamp": ts, "x-bachs-signature": sig };
}

function bachsEvent(eventId: string, checkoutRef: string, amountKobo: number): string {
  return JSON.stringify({
    id: eventId,
    type: "collection.succeeded",
    data: {
      checkout_id: checkoutRef,
      status: "completed",
      amount: (amountKobo / 100).toFixed(2),
      currency: "NGN",
    },
  });
}

async function postWebhook(body: string, ip: string): Promise<Response> {
  return fetch(`${BASE}/api/webhooks/bachs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip, ...signWebhook(body) },
    body,
  });
}

/* ---------------- fixtures ---------------- */

async function createFixtures(): Promise<{ productId: string; raceOrderId: string }> {
  const [creator] = await sbRows<{ id: string }>("creators?select=id&limit=1");
  if (!creator) throw new Error("No creator row found");

  const [product] = await sbRows<{ id: string }>("products", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      public_id: `lt_${RUN}`,
      creator_id: creator.id,
      name: `[LOADTEST ${RUN}] fixture`,
      description: "Load-test fixture — safe to delete",
      price_amount: 10000,
      currency: "NGN",
      status: "published",
    }),
  });

  const fileResponse = await sb("files", {
    method: "POST",
    body: JSON.stringify({
      product_id: product.id,
      original_filename: "fixture.zip",
      storage_key: `loadtest/${RUN}/fixture.zip`,
      mime_type: "application/zip",
      file_size: 1024,
      status: "uploaded",
    }),
  });
  if (!fileResponse.ok) {
    throw new Error(`REST files insert: ${fileResponse.status} ${await fileResponse.text()}`);
  }

  const [raceOrder] = await sbRows<{ id: string }>("orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      product_id: product.id,
      public_id: `lt_${RUN}_race`,
      buyer_email: RACE_EMAIL,
      amount: 10000,
      currency: "NGN",
      status: "pending",
      payment_provider: "bachs",
    }),
  });

  console.log(
    `fixtures: product=${product.id} file=1 raceOrder=${raceOrder.id}`
  );
  return { productId: product.id, raceOrderId: raceOrder.id };
}

async function cleanup(productId: string): Promise<void> {
  const orders = await sbRows<{ id: string }>(
    `orders?buyer_email=like.loadtest_${RUN}*&select=id`
  );
  const ids = orders.map((o) => o.id);
  const inIds = `in.(${ids.join(",")})`;
  const encodedInIds = encodeURIComponent(inIds);

  const deliveriesDeleted = ids.length ? await sbDelete(`deliveries?order_id=${encodedInIds}`) : 0;
  const eventsDeleted = ids.length ? await sbDelete(`payment_events?order_id=${encodedInIds}`) : 0;
  const auditDeleted = ids.length
    ? await sbDelete(`audit_logs?entity_type=eq.order&entity_id=${encodedInIds}`)
    : 0;
  const emailDeleted = ids.length ? await sbDelete(`email_deliveries?order_id=${encodedInIds}`) : 0;
  const ordersDeleted = await sbDelete(`orders?buyer_email=like.loadtest_${RUN}*`);
  const filesDeleted = await sbDelete(`files?product_id=eq.${productId}`);
  const productsDeleted = await sbDelete(`products?id=eq.${productId}`);

  console.log(
    `\ncleanup: orders=${ordersDeleted} deliveries=${deliveriesDeleted} ` +
      `payment_events=${eventsDeleted} email_deliveries=${emailDeleted} audit_logs=${auditDeleted} ` +
      `files=${filesDeleted} products=${productsDeleted}`
  );

  const leftover = await sbRows<{ id: string }>(
    `orders?buyer_email=like.loadtest_${RUN}*&select=id`
  );
  console.log(`leftover loadtest rows: ${leftover.length}`);
}

/* ---------------- main ---------------- */

async function main(): Promise<void> {
  console.log(`Load test → ${BASE} (run ${RUN})`);

  let productId: string | null = null;

  try {
    const { productId: pid, raceOrderId } = await createFixtures();
    productId = pid;

  // Warm-up: compile each route once (Next dev compiles on first hit).
  await runPhase(
    "Warm-up (route compilation)",
    3,
    3,
    async (i) => {
      if (i === 0)
        return fetch(`${BASE}/api/checkout/${productId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "10.99.99.99" },
          body: JSON.stringify({ buyer_email: `${LT_EMAIL_PREFIX}_warm@dropcue.test`, payment_provider: "bachs" }),
        });
      if (i === 1)
        return postWebhook(
          bachsEvent(`lt_warm_${RUN}`, `lt_warm_ref_${RUN}`, 10000),
          "10.99.99.98"
        );
      return fetch(`${BASE}/api/orders/00000000-0000-0000-0000-000000000000/status`, {
        headers: { "x-forwarded-for": "10.99.99.97" },
      });
    }
  );

  // Phase A — checkout burst, rotating IPs (each virtual buyer = own IP)
  await runPhase(
    "A · Checkout burst (product→files→insert)",
    60,
    20,
    async (i) =>
      fetch(`${BASE}/api/checkout/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": fakeIp(i + 1) },
        body: JSON.stringify({
          buyer_email: `${LT_EMAIL_PREFIX}_c${i}@dropcue.test`,
          payment_provider: "bachs",
        }),
      })
  );

  const created = await sbRows<{ id: string; status: string }>(
    `orders?buyer_email=like.loadtest_${RUN}_c*&select=id,status`
  );
  console.log(`   ✓ orders actually created by burst: ${created.length}/60`);

  // Phase B — rate limiter: 15 from a single fresh IP
  await runPhase(
    "B · Rate-limit burst (one IP, budget 10/hr)",
    15,
    15,
    async (i) =>
      fetch(`${BASE}/api/checkout/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.200.0.1", // same IP for every request
        },
        body: JSON.stringify({
          buyer_email: `${LT_EMAIL_PREFIX}_rl${i}@dropcue.test`,
          payment_provider: "bachs",
        }),
      })
  );

  // Phase C — status polling hammer on a real pending order
  const statusOrder = created.find((o) => o.status === "pending") ?? created[0];
  if (!statusOrder) throw new Error("No order created — cannot run phase C");
  await runPhase(
    "C · Status poll hammer (1 embed round-trip)",
    120,
    30,
    async (i) =>
      fetch(`${BASE}/api/orders/${statusOrder.id}/status`, {
        headers: { "x-forwarded-for": fakeIp(1000 + i) },
      })
  );

  // Phase D — webhook burst for nonexistent refs (parallel SELECT path)
  await runPhase(
    "D · Webhook burst (parallel idempotency+lookup)",
    100,
    30,
    async (i) =>
      postWebhook(
        bachsEvent(`lt_evt_${RUN}_${i}`, `lt_ref_${RUN}_${i}`, 10000),
        fakeIp(3000 + i)
      )
  );

  // Phase E — fulfillment race: N concurrent paid events for ONE pending order
  await runPhase(
    "E · Fulfillment race (6 concurrent paid webhooks, one order)",
    6,
    6,
    async (i) =>
      postWebhook(
        bachsEvent(`lt_evt_${RUN}_race_${i}`, raceOrderId, 10000),
        fakeIp(4000 + i)
      )
  );

  const deliveries = await sbRows<{ delivery_token: string }>(
    `deliveries?order_id=eq.${raceOrderId}&select=delivery_token`
  );
  const events = await sbRows<{ id: string }>(
    `payment_events?order_id=eq.${raceOrderId}&select=id`
  );
  const [race] = await sbRows<{ status: string }>(
    `orders?id=eq.${raceOrderId}&select=status`
  );
  console.log(
    `   race outcome: order.status=${race.status} deliveries_created=${deliveries.length} payment_events=${events.length}`
  );
  if (deliveries.length === 1) {
    console.log("   ✓ no duplicate fulfillment under concurrent duplicates");
  } else {
    console.log(
      `   ⚠ RACE DETECTED: ${deliveries.length} deliveries for one order — select-then-update window in fulfillOrder`
    );
  }
  } finally {
    if (productId) await cleanup(productId);
  }
}

main().catch((e) => {
  console.error("Load test failed:", e);
  process.exit(1);
});
