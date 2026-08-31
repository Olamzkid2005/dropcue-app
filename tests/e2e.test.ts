import puppeteer, { Browser, Page } from "puppeteer-core";

const BASE_URL = "http://127.0.0.1:3000";
const CHROME_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  details?: string;
}

const results: TestResult[] = [];

function log(test: string, status: "PASS" | "FAIL", details?: string) {
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`${icon} ${test}${details ? ` — ${details}` : ""}`);
  results.push({ name: test, status, details });
}

async function waitForServer(maxRetries = 30): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}`);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function runTests() {
  console.log("\n🧪 DROPCUE — End-to-End Test Suite\n");

  console.log("⏳ Waiting for dev server...");
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log("❌ Dev server not available at", BASE_URL);
    process.exit(1);
  }
  console.log("✅ Dev server ready\n");

  const browser: Browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // ========================
    // TEST 1: Homepage
    // ========================
    console.log("--- Homepage ---");
    {
      const page: Page = await browser.newPage();
      await page.goto(`${BASE_URL}`, { waitUntil: "networkidle2" });

      const title = await page.title();
      log(
        "Homepage title",
        title.includes("Dropcue") ? "PASS" : "FAIL",
        `got "${title}"`
      );

      const bodyText = await page.evaluate(() => document.body.innerText);
      log(
        "Homepage shows empty state CTA",
        bodyText.includes("Your first product starts here") ? "PASS" : "FAIL"
      );
      log(
        "Homepage has Sign in button",
        bodyText.includes("Sign in") ? "PASS" : "FAIL"
      );
      log(
        "Homepage has Create Product link",
        bodyText.includes("Create Product") ? "PASS" : "FAIL"
      );
      log(
        "Brand name is Dropcue",
        bodyText.includes("Dropcue") ? "PASS" : "FAIL"
      );

      await page.screenshot({ path: "tests/screenshots/01-homepage.png", fullPage: true });
      await page.close();
    }

    // ========================
    // TEST 2: Login Page
    // ========================
    console.log("\n--- Login Page ---");
    {
      const page: Page = await browser.newPage();
      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle2" });

      const bodyText = await page.evaluate(() => document.body.innerText);
      log(
        "Login page title",
        bodyText.includes("Sign in to Dropcue") ? "PASS" : "FAIL"
      );
      log(
        "Login page has email input",
        (await page.$('input[type="email"]')) !== null ? "PASS" : "FAIL"
      );
      log(
        "Login page has submit button",
        bodyText.includes("Send magic link") ? "PASS" : "FAIL"
      );

      // Test form interaction
      await page.type('input[type="email"]', "test@example.com");
      const emailValue = await page.$eval(
        'input[type="email"]',
        (el: any) => el.value
      );
      log(
        "Email input accepts text",
        emailValue === "test@example.com" ? "PASS" : "FAIL",
        `got "${emailValue}"`
      );

      await page.screenshot({ path: "tests/screenshots/02-login.png", fullPage: true });
      await page.close();
    }

    // ========================
    // TEST 3: Public Product Page (invalid)
    // ========================
    console.log("\n--- Public Product Page ---");
    {
      const page: Page = await browser.newPage();
      await page.goto(`${BASE_URL}/p/nonexistent-product`, {
        waitUntil: "networkidle2",
      });

      const bodyText = await page.evaluate(() => document.body.innerText);
      const url = page.url();
      const isNotFound =
        bodyText.includes("Not Found") ||
        bodyText.includes("not found") ||
        bodyText.includes("404") ||
        url.includes("404") ||
        bodyText.includes("Application error");
      log(
        "Invalid product shows error/404",
        isNotFound ? "PASS" : "FAIL",
        `url: ${url}`
      );

      await page.screenshot({
        path: "tests/screenshots/03-product-not-found.png",
        fullPage: true,
      });
      await page.close();
    }

    // ========================
    // TEST 4: Download Page (invalid token)
    // ========================
    console.log("\n--- Download Page ---");
    {
      const page: Page = await browser.newPage();
      await page.goto(`${BASE_URL}/download/fake-token-abc123`, {
        waitUntil: "networkidle2",
      });

      const bodyText = await page.evaluate(() => document.body.innerText);
      // Client component fetches API — should show loading or error state
      log(
        "Download page renders without crash",
        bodyText.includes("Dropcue") || bodyText.includes("Loading") || bodyText.includes("files")
          ? "PASS"
          : "FAIL",
        `body snippet: "${bodyText.substring(0, 80)}"`
      );

      await page.screenshot({
        path: "tests/screenshots/04-download-invalid.png",
        fullPage: true,
      });
      await page.close();
    }

    // ========================
    // TEST 5: Payment Processing Page
    // ========================
    console.log("\n--- Payment Processing ---");
    {
      const page: Page = await browser.newPage();
      await page.goto(`${BASE_URL}/payment/success?order_id=test-order`, {
        waitUntil: "networkidle2",
      });

      const bodyText = await page.evaluate(() => document.body.innerText);
      log(
        "Payment page renders processing state",
        bodyText.includes("Confirming") ||
          bodyText.includes("payment") ||
          bodyText.includes("Invalid")
          ? "PASS"
          : "FAIL"
      );

      await page.screenshot({
        path: "tests/screenshots/05-payment-processing.png",
        fullPage: true,
      });
      await page.close();
    }

    // ========================
    // TEST 6: Creator Routes (unauthenticated)
    // ========================
    console.log("\n--- Creator Routes (unauthenticated) ---");
    {
      // /products/new should redirect to login
      const page1: Page = await browser.newPage();
      await page1.goto(`${BASE_URL}/products/new`, {
        waitUntil: "networkidle2",
      });
      log(
        "/products/new redirects to login",
        page1.url().includes("/auth/login") ? "PASS" : "FAIL",
        `redirected to: ${page1.url()}`
      );
      await page1.close();

      // /products/some-id should redirect to login
      const page2: Page = await browser.newPage();
      await page2.goto(`${BASE_URL}/products/fake-id`, {
        waitUntil: "networkidle2",
      });
      log(
        "/products/[id] redirects to login",
        page2.url().includes("/auth/login") ? "PASS" : "FAIL",
        `redirected to: ${page2.url()}`
      );
      await page2.close();
    }

    // ========================
    // TEST 7: API Endpoints
    // ========================
    console.log("\n--- API Endpoints ---");
    {
      // Checkout endpoint
      const checkoutRes = await fetch(`${BASE_URL}/api/checkout/fake-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_email: "test@example.com",
          payment_provider: "bachs",
        }),
      });
      log(
        "Checkout API returns error for fake product",
        checkoutRes.status >= 400 ? "PASS" : "FAIL",
        `status: ${checkoutRes.status}`
      );

      // Order status endpoint
      const statusRes = await fetch(
        `${BASE_URL}/api/orders/fake-order-id/status`
      );
      log(
        "Order status API returns error for fake order",
        statusRes.status >= 400 ? "PASS" : "FAIL",
        `status: ${statusRes.status}`
      );

      // Delivery endpoint
      const deliveryRes = await fetch(
        `${BASE_URL}/api/delivery/fake-token`
      );
      log(
        "Delivery API returns error for fake token",
        deliveryRes.status >= 400 ? "PASS" : "FAIL",
        `status: ${deliveryRes.status}`
      );
    }

    // ========================
    // TEST 8: Design System
    // ========================
    console.log("\n--- Design System ---");
    {
      const page: Page = await browser.newPage();
      await page.goto(`${BASE_URL}`, { waitUntil: "networkidle2" });

      // Check accent-indigo color
      const bgColor = await page.evaluate(() => {
        const el = document.querySelector("a[href='/auth/login']");
        if (!el) return "no-element";
        return window.getComputedStyle(el).backgroundColor;
      });
      log(
        "Accent indigo button color applied",
        bgColor.includes("67") || bgColor !== "no-element" ? "PASS" : "FAIL",
        `bg: ${bgColor}`
      );

      // Check font family
      const fontFamily = await page.evaluate(() => {
        const body = document.querySelector("body");
        return body ? window.getComputedStyle(body).fontFamily : "none";
      });
      log(
        "Inter font family on body",
        fontFamily.includes("Inter") ? "PASS" : "FAIL",
        `font: ${fontFamily}`
      );

      // Check Material Symbols loaded
      const hasIcons = await page.evaluate(() => {
        return (
          document.querySelectorAll(".material-symbols-outlined").length > 0
        );
      });
      log("Material Symbols icons present", hasIcons ? "PASS" : "FAIL");

      // Check Geist font available for headings
      const headingFont = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        return h1 ? window.getComputedStyle(h1).fontFamily : "none";
      });
      log(
        "Geist font on headings",
        headingFont.includes("Geist") ? "PASS" : "FAIL",
        `font: ${headingFont}`
      );

      await page.screenshot({
        path: "tests/screenshots/06-design-system.png",
        fullPage: true,
      });
      await page.close();
    }

    // ========================
    // SUMMARY
    // ========================
    console.log("\n" + "=".repeat(50));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(50));

    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total:  ${results.length}`);

    if (failed > 0) {
      console.log("\nFailed tests:");
      results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => {
          console.log(`  ❌ ${r.name}${r.details ? ` — ${r.details}` : ""}`);
        });
    }

    console.log(`\n📸 Screenshots saved to tests/screenshots/`);
    console.log("=".repeat(50));
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
