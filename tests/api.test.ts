// Quick API-only test — runs against a running dev server
const BASE = "http://127.0.0.1:3000";
const results: { name: string; status: string; details?: string }[] = [];

function errMsg(e: unknown): string {
  return e instanceof Error ? errMsg(e) : String(e);
}

function log(name: string, pass: boolean, details?: string) {
  const icon = pass ? "✅" : "❌";
  console.log(`${icon} ${name}${details ? ` — ${details}` : ""}`);
  results.push({ name, status: pass ? "PASS" : "FAIL", details });
}

async function run() {
  console.log("\n🔌 DROPCUE — API Endpoint Tests\n");

  // 1. Setup Status
  try {
    const res = await fetch(`${BASE}/api/setup/status`);
    const data = await res.json();
    log("Setup status returns table info", res.ok && typeof data.tables === "object");
    const allExist = Object.values(data.tables).every(Boolean);
    log("All 9 tables exist", allExist, `${Object.values(data.tables).filter(Boolean).length}/9`);
  } catch (e) {
    log("Setup status", false, errMsg(e));
  }

  // 2. Setup SQL
  try {
    const res = await fetch(`${BASE}/api/setup/sql`);
    const sql = await res.text();
    log("Setup SQL endpoint returns schema", res.ok && sql.includes("CREATE TABLE"), `${sql.length} chars`);
  } catch (e) {
    log("Setup SQL", false, errMsg(e));
  }

  // 3. Homepage
  try {
    const res = await fetch(`${BASE}`);
    log("Homepage returns 200", res.ok);
  } catch (e) {
    log("Homepage", false, errMsg(e));
  }

  // 4. Login page
  try {
    const res = await fetch(`${BASE}/auth/login`);
    const html = await res.text();
    log("Login page renders", res.ok && html.includes("Sign in"), html.includes("magic link") ? "magic link form" : "");
  } catch (e) {
    log("Login page", false, errMsg(e));
  }

  // 5. Setup page
  try {
    const res = await fetch(`${BASE}/setup`);
    log("Setup page renders", res.ok);
  } catch (e) {
    log("Setup page", false, errMsg(e));
  }

  // 6. Public product page (invalid)
  try {
    const res = await fetch(`${BASE}/p/nonexistent`);
    log("Invalid product returns response", res.ok || res.status === 404, `status: ${res.status}`);
  } catch (e) {
    log("Invalid product page", false, errMsg(e));
  }

  // 7. Download page (invalid)
  try {
    const res = await fetch(`${BASE}/download/fake-token`);
    log("Download page renders", res.ok, `status: ${res.status}`);
  } catch (e) {
    log("Download page", false, errMsg(e));
  }

  // 8. Payment success page
  try {
    const res = await fetch(`${BASE}/payment/success?order_id=test`);
    log("Payment success page renders", res.ok, `status: ${res.status}`);
  } catch (e) {
    log("Payment success page", false, errMsg(e));
  }

  // Summary
  console.log("\n" + "=".repeat(40));
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  console.log(`✅ Passed: ${passed}  ❌ Failed: ${failed}  📋 Total: ${results.length}`);
  console.log("=".repeat(40));
}

run().catch(console.error);
