/**
 * End-to-end click-through of the product delete flow:
 *
 *   1. Sign in via the real login UI (password account created through the
 *      Supabase admin API — service-role, never exposed to the app).
 *   2. Fixture A: published product with NO orders  → permanent delete must
 *      succeed (product + files row gone from Supabase, card gone from UI).
 *   3. Fixture B: published product WITH an order   → permanent delete must
 *      be refused with a visible error; archive must still succeed.
 *   4. Cleanup: delete fixtures and the test user.
 *
 * Run:  npx tsx tests/delete-flow-e2e.mjs
 */
import puppeteer from "puppeteer-core";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ── env ──────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (ok, msg, extra = "") =>
  console.log(`${ok ? "✅" : "❌"} ${msg}${extra ? ` — ${extra}` : ""}`);

// ── service-role helpers (fixtures only; the app never sees this key) ────
async function adminRest(path, method = "GET", body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON */
  }
  return { status: res.status, data };
}

async function createAuthUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (res.ok) return { id: data.id, created: true };
  if (res.status === 422) {
    // already registered → look the id up
    const list = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`,
      {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      }
    ).then((r) => r.json());
    const found = (list.users ?? []).find((u) => u.email === email);
    if (found) return { id: found.id, created: false };
  }
  throw new Error(`Could not create test user: ${JSON.stringify(data)}`);
}

async function deleteAuthUser(userId) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

// ── browser helpers ──────────────────────────────────────────────────────
async function openDeleteDialog(page, productName) {
  const clicked = await page.evaluate((name) => {
    const cards = Array.from(document.querySelectorAll("body > div a"));
    const card = cards.find((c) => c.textContent.includes(name));
    if (!card) return "card-missing";
    // Actions are now siblings of the product link, not nested inside it.
    const row = card.parentElement?.parentElement;
    const ellipsis = row?.querySelector("button");
    if (!ellipsis) return "button-missing";
    ellipsis.click();
    return "clicked";
  }, productName);
  if (clicked !== "clicked") {
    throw new Error(
      clicked === "card-missing"
        ? `Product card "${productName}" not found`
        : "⋯ button not found"
    );
  }
  await sleep(500);
  // The dropdown opens inside the card; find "Delete Product" inside it
  const hasDelete = await page.evaluate((name) =>
    document.body.innerText.includes(name) && document.body.innerText.includes("Delete Product"),
  productName);
  if (!hasDelete) throw new Error("Delete menu did not open");
  // Click the menu item (scoped to the card's dropdown)
  const menuClicked = await page.evaluate((name) => {
    const cards = Array.from(document.querySelectorAll("body > div a"));
    const card = cards.find((c) => c.textContent.includes(name));
    const row = card?.parentElement?.parentElement;
    const del = Array.from(row?.querySelectorAll("button") ?? []).find((b) => b.textContent?.includes("Delete Product"));
    if (!del) return false;
    del.click();
    return true;
  }, productName);
  if (!menuClicked) throw new Error("Delete Product menu item not found");
  // Confirm dialog appears at page level
  try {
    await page.waitForFunction(
      (name) =>
        Array.from(document.querySelectorAll("h3")).some((h) =>
          h.textContent?.includes("Delete Product")
        ) && document.body.innerText.includes(name),
      { timeout: 5000 },
      productName
    );
  } catch {
    const h3s = await page.evaluate(() =>
      Array.from(document.querySelectorAll("h3")).map((h) => h.textContent)
    );
    const dialogs = await page.evaluate(() =>
      document.querySelectorAll(".fixed.inset-0").length
    );
    throw new Error(
      `Dialog did not appear — h3s=${JSON.stringify(h3s)} overlays=${dialogs}`
    );
  }
}

async function clickCheckbox(page) {
  await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    const box = boxes.find((b) =>
      b.closest("label")?.textContent?.includes("Permanently delete")
    );
    if (!box) throw new Error("Permanently-delete checkbox not found");
    box.click();
  });
  await sleep(200);
}

async function clickDialogButton(page, label) {
  const clicked = await page.evaluate((text) => {
    const btns = Array.from(document.querySelectorAll("button"));
    const btn = btns.find((b) => b.textContent?.trim().includes(text));
    if (!btn) return false;
    btn.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`Dialog button "${label}" not found`);
}

async function dialogError(page) {
  return page.evaluate(() => {
    const alert = document.querySelector('[role="alert"]');
    return alert ? alert.textContent.trim() : "";
  });
}

// ── main ─────────────────────────────────────────────────────────────────
async function main() {
  const stamp = randomBytes(4).toString("hex");
  const email = `e2e-delete-${stamp}@dropcue-test.dev`;
  const password = `E2ePass!${stamp}aA1`;
  const nameA = `E2E Delete A ${stamp}`;
  const nameB = `E2E Delete B ${stamp}`;

  const user = await createAuthUser(email, password);
  log(true, `Test user ready (${user.created ? "created" : "reused"})`, email);

  const { data: productA } = await adminRest("products", "POST", {
    creator_id: user.id,
    name: nameA,
    price_amount: 500_000,
    currency: "NGN",
    status: "published",
    public_id: `e2e${stamp}aaaaaaaaaa`,
  });
  const { data: productB } = await adminRest("products", "POST", {
    creator_id: user.id,
    name: nameB,
    price_amount: 750_000,
    currency: "NGN",
    status: "published",
    public_id: `e2e${stamp}bbbbbbbbbb`,
  });
  if (!productA?.[0]?.id || !productB?.[0]?.id) throw new Error("Fixture products failed");
  const idA = productA[0].id;
  const idB = productB[0].id;

  const { data: order } = await adminRest("orders", "POST", {
    product_id: idB,
    public_id: `e2e${stamp}cccccccccc`,
    buyer_email: "buyer@dropcue-test.dev",
    amount: 750_000,
    currency: "NGN",
    status: "pending",
    payment_provider: "bachs",
  });
  if (!order?.[0]?.id) throw new Error("Fixture order failed");
  log(true, "Fixtures ready", `A=${idA} B=${idB} order=${order[0].id}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30_000);

    // 1. Sign in through the real UI
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/dashboard"),
      { timeout: 20000 }
    );
    log(true, "Signed in via login UI", page.url());

    // 2. Products page shows both fixtures
    await page.goto(`${BASE}/dashboard/products`, { waitUntil: "networkidle2" });
    await page.waitForFunction(
      (n) => document.body.innerText.includes(n),
      { timeout: 10000 },
      nameA
    );
    log(true, "Products page lists fixtures");

    // ── TEST A: permanent delete of never-sold product ──
    await openDeleteDialog(page, nameA);
    await page.screenshot({ path: "tests/screenshots/delete-1-dialog.png" });
    await clickCheckbox(page);
    await page.screenshot({ path: "tests/screenshots/delete-2-permanent.png" });
    await clickDialogButton(page, "Delete Forever");

    // Card disappears from the UI
    try {
      await page.waitForFunction(
        (n) => !document.body.innerText.includes(n),
        { timeout: 10000 },
        nameA
      );
      log(true, "UI: product A card removed from list");
    } catch {
      log(false, "UI: product A card still visible after Delete Forever");
    }

    // Row gone from Supabase
    const checkA = await adminRest(
      `products?id=eq.${idA}&select=id,status`
    );
    const filesA = await adminRest(`files?product_id=eq.${idA}&select=id`);
    log(
      (checkA.data ?? []).length === 0,
      "DB: product A row deleted",
      JSON.stringify(checkA.data)
    );
    log(
      (filesA.data ?? []).length === 0,
      "DB: product A files deleted",
      JSON.stringify(filesA.data)
    );

    // ── TEST B: refusal for a product WITH orders ──
    await openDeleteDialog(page, nameB);
    await clickCheckbox(page);
    await clickDialogButton(page, "Delete Forever");
    await sleep(1500);
    const refusal = await dialogError(page);
    log(
      refusal.includes("Purchased products cannot be permanently deleted"),
      "UI: sold-product permanent delete refused with visible error",
      refusal || "(no alert shown)"
    );
    await page.screenshot({ path: "tests/screenshots/delete-3-refusal.png" });

    const checkB1 = await adminRest(`products?id=eq.${idB}&select=id,status`);
    log(
      (checkB1.data ?? []).length === 1,
      "DB: product B still exists after refusal",
      JSON.stringify(checkB1.data)
    );

    // ── TEST C: archive path still works ──
    await clickDialogButton(page, "Cancel");
    await sleep(300);
    await openDeleteDialog(page, nameB);
    await clickDialogButton(page, "Archive");
    await sleep(1500);
    const checkB2 = await adminRest(`products?id=eq.${idB}&select=id,status`);
    log(
      checkB2.data?.[0]?.status === "archived",
      "DB: archive path works (product B archived)",
      JSON.stringify(checkB2.data)
    );
    await page.screenshot({ path: "tests/screenshots/delete-4-archived.png" });
  } finally {
    await browser.close();
  }

  // ── cleanup ────────────────────────────────────────────────────────────
  await adminRest(`orders?product_id=eq.${idB}`, "DELETE");
  await adminRest(`files?product_id=in.(${idA},${idB})`, "DELETE");
  await adminRest(`products?id=in.(${idA},${idB})`, "DELETE");
  await deleteAuthUser(user.id);
  log(true, "Cleanup done (orders, products, files, test user removed)");
}

main().catch((err) => {
  console.error("❌ Flow failed:", err.message);
  process.exit(1);
});
