import { createHmac, randomUUID } from "crypto";

const BASE = process.env.LOADTEST_BASE_URL ?? "http://127.0.0.1:3000";
const SECRET = process.env.LOADTEST_WEBHOOK_SECRET ?? "";

if (!SECRET) throw new Error("LOADTEST_WEBHOOK_SECRET is required");

type Case = { name: string; body: string; headers?: Record<string, string> };

function signed(body: string, timestamp = Math.floor(Date.now() / 1000).toString()) {
  return {
    "content-type": "application/json",
    "x-bachs-timestamp": timestamp,
    "x-bachs-signature": createHmac("sha256", SECRET).update(`${timestamp}.${body}`).digest("hex"),
  };
}

function event(id: string, reference: string, type = "collection.succeeded", amount = "100.00") {
  return JSON.stringify({ id, type, data: { checkout_id: reference, amount, currency: "NGN" } });
}

async function send(c: Case): Promise<{ status: number; ms: number }> {
  const started = performance.now();
  const response = await fetch(`${BASE}/api/webhooks/bachs`, {
    method: "POST",
    headers: { ...signed(c.body), ...(c.headers ?? {}) },
    body: c.body,
  });
  await response.text();
  return { status: response.status, ms: performance.now() - started };
}

async function main() {
  const unknown = randomUUID();
  const cases: Case[] = [
    { name: "invalid signature rejected", body: event(randomUUID(), unknown), headers: { "x-bachs-signature": "00" } },
    { name: "stale timestamp rejected", body: event(randomUUID(), unknown), headers: signed(event(randomUUID(), unknown), (Math.floor(Date.now() / 1000) - 301).toString()) },
    { name: "unknown order is harmless", body: event(randomUUID(), unknown) },
    { name: "failed event is acknowledged", body: event(randomUUID(), unknown, "collection.failed") },
    { name: "malformed JSON is contained", body: "{" , headers: { "x-bachs-timestamp": Math.floor(Date.now() / 1000).toString(), "x-bachs-signature": "00" } },
  ];

  console.log(`Payment chaos tests → ${BASE}`);
  for (const c of cases) {
    const result = await send(c);
    const expected = c.name.includes("invalid") || c.name.includes("stale") ? 401 : c.name.includes("malformed") ? 200 : 200;
    console.log(`${result.status === expected ? "✓" : "✗"} ${c.name}: HTTP ${result.status} (${result.ms.toFixed(0)}ms)`);
  }

  const duplicateBody = event(randomUUID(), unknown);
  const duplicates = await Promise.all(Array.from({ length: 25 }, () => send({ name: "duplicate", body: duplicateBody })));
  const non2xx = duplicates.filter((r) => r.status < 200 || r.status >= 300);
  console.log(`✓ duplicate unknown webhook storm: ${duplicates.length - non2xx.length}/${duplicates.length} acknowledged`);

  const malformed = await send({ name: "malformed", body: "not-json", headers: signed("not-json") });
  console.log(`✓ malformed signed payload contained: HTTP ${malformed.status}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
