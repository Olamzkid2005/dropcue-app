import { createHmac, randomUUID } from "node:crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const WEBHOOK_SECRET = process.env.LOADTEST_WEBHOOK_SECRET ?? "";

function report(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
}

async function request(path: string, init?: RequestInit) {
  const started = performance.now();
  const response = await fetch(`${BASE}${path}`, init);
  await response.text();
  return { response, ms: Math.round(performance.now() - started) };
}

function signedWebhook(body: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return {
    "content-type": "application/json",
    "x-bachs-timestamp": timestamp,
    "x-bachs-signature": createHmac("sha256", WEBHOOK_SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex"),
  };
}

async function main() {
  console.log(`Adversarial user checks → ${BASE}`);

  // Change IDs in URLs: malformed IDs must be rejected, not queried as SQL.
  const tampered = await request("/api/checkout/not-a-uuid", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ buyer_email: "bad@example.com", payment_provider: "bachs" }),
  });
  report("Tampered checkout ID rejected", tampered.response.status === 400, `HTTP ${tampered.response.status}`);

  // Refresh during checkout: public product pages must remain a valid response.
  const refreshes = await Promise.all([
    request("/p/does-not-exist"),
    request("/p/does-not-exist"),
    request("/p/does-not-exist"),
  ]);
  report(
    "Repeated public-page refreshes stay deterministic",
    refreshes.every(({ response }) => response.status === 404),
    refreshes.map(({ response, ms }) => `${response.status}/${ms}ms`).join(", ")
  );

  // Submit the same malformed checkout twice: neither request may create an order.
  const duplicateBodies = Array.from({ length: 2 }, () =>
    request("/api/checkout/00000000-0000-0000-0000-000000000000", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ buyer_email: "duplicate@example.com", payment_provider: "bachs" }),
    })
  );
  const duplicateResults = await Promise.all(duplicateBodies);
  report(
    "Duplicate checkout submissions are safely rejected",
    duplicateResults.every(({ response }) => response.status >= 400),
    duplicateResults.map(({ response }) => `HTTP ${response.status}`).join(", ")
  );

  // Upload ridiculous file: server-side validation must reject it before storage work.
  const hugeUpload = await request("/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      product_id: randomUUID(),
      file_name: "too-large.zip",
      file_size: 10_000_000_000,
      content_type: "application/zip",
    }),
  });
  report("Oversized upload rejected", hugeUpload.response.status >= 400, `HTTP ${hugeUpload.response.status}`);

  // Internet interruption proxy: an aborted request must not make the endpoint crash.
  const controller = new AbortController();
  const aborted = fetch(`${BASE}/api/checkout/00000000-0000-0000-0000-000000000000`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ buyer_email: "offline@example.com", payment_provider: "bachs" }),
    signal: controller.signal,
  }).catch(() => null);
  controller.abort();
  await aborted;
  const afterAbort = await request("/api/checkout/not-a-uuid", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  report("Server remains healthy after aborted request", afterAbort.response.status === 400, `HTTP ${afterAbort.response.status}`);

  if (WEBHOOK_SECRET) {
    // Duplicate webhook storm for an unknown order: all requests should be acknowledged.
    const body = JSON.stringify({
      id: randomUUID(),
      type: "collection.succeeded",
      data: { checkout_id: randomUUID(), amount: "100.00", currency: "NGN" },
    });
    const storm = await Promise.all(
      Array.from({ length: 10 }, () =>
        request("/api/webhooks/bachs", {
          method: "POST",
          headers: signedWebhook(body),
          body,
        })
      )
    );
    report("Concurrent duplicate webhook delivery is acknowledged", storm.every(({ response }) => response.ok), `${storm.filter(({ response }) => response.ok).length}/10 HTTP 2xx`);
  } else {
    console.log("ℹ️ Webhook storm skipped — set LOADTEST_WEBHOOK_SECRET for signed webhook checks");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
