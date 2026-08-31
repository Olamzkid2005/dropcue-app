/**
 * Phase 9: Comprehensive E2E Test Suite
 * Tests all flows, mobile responsiveness, loading states, and error handling.
 */

import puppeteer from "puppeteer-core";

const BASE_URL = "http://127.0.0.1:3000";

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
  category: string;
}

const results: TestResult[] = [];

function log(name: string, passed: boolean, detail = "", category = "general") {
  results.push({ name, passed, detail, category });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await puppeteer.launch({
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    // ═══════════════════════════════════════════════
    // 1. PUBLIC PAGES — Mobile & Desktop
    // ═══════════════════════════════════════════════
    console.log("\n📱 SECTION 1: Public Pages — Desktop (1280x720)");

    await page.setViewport({ width: 1280, height: 720 });

    // Homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    const homeTitle = await page.title();
    log("Homepage renders", homeTitle.includes("Dropcue"), `title="${homeTitle}"`, "public");
    log("Homepage has correct title", homeTitle.includes("Dropcue"), "", "public");

    // Check nav exists
    const navExists = await page.$("nav");
    log("Navigation bar renders", !!navExists, "", "public");

    // Check brand name
    const brandText = await page.$$eval("nav *", (els) =>
      els.map((el) => el.textContent ?? "").find((t) => t.includes("Dropcue"))
    ).catch(() => "");
    log("Brand name 'Dropcue' in nav", !!brandText, brandText, "public");

    // Login page
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle2" });
    const loginTitle = await page.title();
    log("Login page renders", loginTitle.includes("Dropcue"), "", "public");

    // Check social login buttons
    const googleBtn = await page.$$eval("button", (els) =>
      els.some((el) => (el.textContent ?? "").includes("Google"))
    );
    log("Google sign-in button present", googleBtn, "", "public");

    const appleBtn = await page.$$eval("button", (els) =>
      els.some((el) => (el.textContent ?? "").includes("Apple"))
    );
    log("Apple sign-in button present", appleBtn, "", "public");

    // Check email input
    const emailInput = await page.$('input[type="email"]');
    log("Email input present", !!emailInput, "", "public");

    // Check magic link button
    const magicBtn = await page.$$eval("button", (els) =>
      els.some((el) => (el.textContent ?? "").includes("Send magic link"))
    );
    log("Magic link button present", magicBtn, "", "public");

    // Public product page (invalid)
    await page.goto(`${BASE_URL}/p/invalid_id`, { waitUntil: "networkidle2" });
    const invalidProductContent = await page.content();
    log(
      "Invalid product shows error/not found",
      invalidProductContent.includes("not found") ||
        invalidProductContent.includes("error") ||
        invalidProductContent.includes("404"),
      "",
      "public"
    );

    // Download page (invalid token)
    await page.goto(`${BASE_URL}/download/invalid_token`, {
      waitUntil: "networkidle2",
    });
    const downloadContent = await page.content();
    log(
      "Invalid download token handled",
      downloadContent.includes("invalid") ||
        downloadContent.includes("error") ||
        downloadContent.includes("Invalid") ||
        downloadContent.includes("not found"),
      "",
      "public"
    );

    // Payment success page
    await page.goto(`${BASE_URL}/payment/success`, {
      waitUntil: "networkidle2",
    });
    const successContent = await page.content();
    log(
      "Payment success page renders",
      successContent.includes("payment") ||
        successContent.includes("success") ||
        successContent.includes("confirming"),
      "",
      "public"
    );

    // ═══════════════════════════════════════════════
    // 2. MOBILE RESPONSIVENESS
    // ═══════════════════════════════════════════════
    console.log("\n📱 SECTION 2: Mobile Responsiveness (375x812)");

    await page.setViewport({ width: 375, height: 812 });

    // Homepage mobile
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    const mobileHomeTitle = await page.title();
    log("Homepage mobile renders", mobileHomeTitle.includes("Dropcue"), "", "mobile");

    // Check no horizontal overflow
    const homeOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    log("Homepage no horizontal overflow (mobile)", homeOverflow, "", "mobile");

    // Login page mobile
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle2" });
    const loginOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    log("Login page no horizontal overflow (mobile)", loginOverflow, "", "mobile");

    // Check buttons are full-width on mobile
    const btnWidth = await page.$$eval("button", (els) => {
      const submitBtn = els.find(
        (el) => (el.textContent ?? "").includes("Send magic link")
      );
      if (!submitBtn) return 0;
      const rect = submitBtn.getBoundingClientRect();
      return rect.width;
    });
    log(
      "Login submit button fills container on mobile",
      btnWidth > 250,
      `width=${btnWidth}px (viewport=375px, with padding)`,
      "mobile"
    );

    // Payment success mobile
    await page.goto(`${BASE_URL}/payment/success`, {
      waitUntil: "networkidle2",
    });
    const successOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    log("Payment success no overflow (mobile)", successOverflow, "", "mobile");

    // Download page mobile
    await page.goto(`${BASE_URL}/download/test_token`, {
      waitUntil: "networkidle2",
    });
    const downloadOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    log("Download page no overflow (mobile)", downloadOverflow, "", "mobile");

    // ═══════════════════════════════════════════════
    // 3. TABLET RESPONSIVENESS
    // ═══════════════════════════════════════════════
    console.log("\n📱 SECTION 3: Tablet Responsiveness (768x1024)");

    await page.setViewport({ width: 768, height: 1024 });

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    log("Homepage no overflow (tablet)", tabletOverflow, "", "tablet");

    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle2" });
    const tabletLoginOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    log("Login page no overflow (tablet)", tabletLoginOverflow, "", "tablet");

    // ═══════════════════════════════════════════════
    // 4. MIDDLEWARE & AUTH PROTECTION
    // ═══════════════════════════════════════════════
    console.log("\n🔒 SECTION 4: Middleware & Auth Protection");

    await page.setViewport({ width: 1280, height: 720 });

    const protectedRoutes = ["/products/new", "/products/test-id", "/orders"];
    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2" });
      const currentUrl = page.url();
      log(
        `${route} → redirects to login`,
        currentUrl.includes("/auth/login"),
        `url=${currentUrl}`,
        "auth"
      );
    }

    // Auth callback with invalid code
    await page.goto(`${BASE_URL}/auth/callback?code=bad`, {
      waitUntil: "networkidle2",
    });
    const callbackUrl = page.url();
    log(
      "Invalid auth callback → redirects to login with error",
      callbackUrl.includes("/auth/login") && callbackUrl.includes("error"),
      `url=${callbackUrl}`,
      "auth"
    );

    // ═══════════════════════════════════════════════
    // 5. API ROUTES — Error Handling
    // ═══════════════════════════════════════════════
    console.log("\n🔌 SECTION 5: API Routes — Error Handling");

    // Checkout with invalid product
    const checkoutResp = await page.goto(
      `${BASE_URL}/api/checkout/00000000-0000-0000-0000-000000000000`,
      { waitUntil: "networkidle2" }
    );
    log(
      "Checkout API returns error for invalid product",
      checkoutResp?.status() === 400 || checkoutResp?.status() === 404 || checkoutResp?.status() === 405,
      `status=${checkoutResp?.status()}`,
      "api"
    );

    // Order status with invalid UUID
    await page.goto(`${BASE_URL}/api/orders/invalid-id/status`, {
      waitUntil: "networkidle2",
    });
    const orderStatusContent = await page.content();
    log(
      "Order status API handles invalid UUID",
      orderStatusContent.includes("error") || orderStatusContent.includes("Invalid"),
      "",
      "api"
    );

    // Delivery with invalid token
    await page.goto(`${BASE_URL}/api/delivery/invalid-token`, {
      waitUntil: "networkidle2",
    });
    const deliveryContent = await page.content();
    log(
      "Delivery API handles invalid token",
      deliveryContent.includes("error") || deliveryContent.includes("Invalid") || deliveryContent.includes("invalid"),
      "",
      "api"
    );

    // Upload without auth
    const uploadResp = await page.evaluate(async () => {
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: "00000000-0000-0000-0000-000000000000",
          file_name: "test.pdf",
          file_size: 1024,
          content_type: "application/pdf",
        }),
      });
      return { status: resp.status, body: await resp.json() };
    });
    log(
      "Upload API rejects unauthenticated request",
      uploadResp.status === 401 || uploadResp.status === 403 || uploadResp.body?.error,
      `status=${uploadResp.status}`,
      "api"
    );

    // ═══════════════════════════════════════════════
    // 6. DESIGN SYSTEM CONSISTENCY
    // ═══════════════════════════════════════════════
    console.log("\n🎨 SECTION 6: Design System Consistency");

    await page.setViewport({ width: 1280, height: 720 });

    // Check accent-indigo color on homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    const bodyBg = await page.$eval("body", (el) =>
      getComputedStyle(el).backgroundColor
    ).catch(() => "");
    log(
      "Body background color correct",
      bodyBg === "rgb(241, 245, 249)",
      `bg=${bodyBg}`,
      "design"
    );

    // Check Material Symbols loaded
    const hasMaterialSymbols = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("link"));
      return links.some((l) => (l.href ?? "").includes("material-symbols"));
    });
    // Also check via CSS usage
    const hasMaterialIcon = await page.evaluate(() => {
      return document.querySelector(".material-symbols-outlined") !== null;
    });
    log(
      "Material Symbols available",
      hasMaterialSymbols || hasMaterialIcon,
      "",
      "design"
    );

    // Check Geist font on headings
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle2" });
    const h1Font = await page.$eval("h1", (el) =>
      getComputedStyle(el).fontFamily
    ).catch(() => "");
    log(
      "Heading uses Geist font",
      h1Font.includes("Geist") || h1Font.includes("geist"),
      `font=${h1Font.slice(0, 60)}`,
      "design"
    );

    // Check Inter font on body
    const bodyFont = await page.$eval("body", (el) =>
      getComputedStyle(el).fontFamily
    ).catch(() => "");
    log(
      "Body uses Inter font",
      bodyFont.includes("Inter") || bodyFont.includes("inter"),
      `font=${bodyFont.slice(0, 60)}`,
      "design"
    );

    // ═══════════════════════════════════════════════
    // 7. LOADING STATES
    // ═══════════════════════════════════════════════
    console.log("\n⏳ SECTION 7: Loading States");

    // Login form should show loading on submit
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', "test@example.com");

    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]');
    await sleep(200);

    const loadingText = await page.$$eval("button", (els) => {
      const btn = els.find((el) => (el.textContent ?? "").includes("Sending"));
      return btn?.textContent ?? "";
    });
    log(
      "Login shows 'Sending...' loading state",
      loadingText.includes("Sending"),
      `text="${loadingText.trim()}"`,
      "loading"
    );

    // Wait for response
    await sleep(3000);

    // Should show success or rate limit
    const postSubmitContent = await page.content();
    log(
      "Login form shows result after submit",
      postSubmitContent.includes("Check your email") ||
        postSubmitContent.includes("rate limit") ||
        postSubmitContent.includes("error"),
      "",
      "loading"
    );

    // ═══════════════════════════════════════════════
    // 8. ERROR HANDLING
    // ═══════════════════════════════════════════════
    console.log("\n⚠️ SECTION 8: Error Handling");

    // Login with error param
    await page.goto(`${BASE_URL}/auth/login?error=auth_callback_error`, {
      waitUntil: "networkidle2",
    });
    const errorPageContent = await page.content();
    log(
      "Login page handles error param",
      errorPageContent.includes("Sign in to Dropcue"),
      "",
      "errors"
    );

    // Form should still be functional
    const formStillWorks = await page.$('input[type="email"]');
    log("Form still functional after error", !!formStillWorks, "", "errors");

    // ═══════════════════════════════════════════════
    // 9. FEEDBACK BUTTON
    // ═══════════════════════════════════════════════
    console.log("\n💬 SECTION 9: Feedback Button");

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });

    // Check feedback button exists
    const feedbackBtn = await page.$$eval("button", (els) =>
      els.some((el) => (el.textContent ?? "").includes("Feedback"))
    );
    log("Feedback button visible on homepage", feedbackBtn, "", "feedback");

    // Click feedback button
    if (feedbackBtn) {
      await page.click('button[aria-label="Send feedback"]');
      await sleep(500);

      // Check modal opened
      const modalContent = await page.content();
      log(
        "Feedback modal opens",
        modalContent.includes("Send feedback") && modalContent.includes("Tell us more"),
        "",
        "feedback"
      );

      // Check category buttons
      const categoryBtns = await page.$$eval("button", (els) =>
        els.filter(
          (el) =>
            (el.textContent ?? "").includes("broken") ||
            (el.textContent ?? "").includes("confusing") ||
            (el.textContent ?? "").includes("Feature request") ||
            (el.textContent ?? "").includes("Just give feedback")
        ).length
      );
      log(
        "Feedback modal has 4 category buttons",
        categoryBtns >= 4,
        `found=${categoryBtns}`,
        "feedback"
      );

      // Close modal by clicking backdrop
      const backdrop = await page.$('.absolute.inset-0.bg-black\\/30');
      if (backdrop) {
        await backdrop.click();
        await sleep(300);
      }
    }

    // ═══════════════════════════════════════════════
    // 10. FOOTER
    // ═══════════════════════════════════════════════
    console.log("\n📋 SECTION 10: Footer & Navigation");

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });

    // Check nav has key elements
    const navContent = await page.$$eval("nav *", (els) =>
      els.map((el) => el.textContent ?? "").join(" ")
    );
    log("Nav has brand name", navContent.includes("Dropcue"), "", "nav");
    // Nav has Sign in link when not authenticated
    log(
      "Nav has Sign in link (unauthenticated)",
      navContent.includes("Sign in"),
      "",
      "nav"
    );

    // Check for footer (may not exist in all layouts)
    const footerExists = await page.$("footer").catch(() => null);
    if (footerExists) {
      const footerContent = await page.$$eval("footer *", (els) =>
        els.map((el) => el.textContent ?? "").join(" ")
      ).catch(() => "");
      log(
        "Footer has copyright or brand",
        footerContent.includes("Dropcue") || footerContent.includes("2024") || footerContent.includes("2025") || footerContent.includes("2026"),
        footerContent.slice(0, 80),
        "nav"
      );
      log(
        "Footer has navigation links",
        footerContent.includes("Terms") || footerContent.includes("Privacy") || footerContent.includes("Help"),
        "",
        "nav"
      );
    } else {
      log("Footer present in layout", false, "no <footer> element found", "nav");
    }

  } catch (err) {
    console.error("\n💥 Test error:", err);
  } finally {
    await browser.close();
  }

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  // Category breakdown
  const categories = [...new Set(results.map((r) => r.category))];
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catPassed = catResults.filter((r) => r.passed).length;
    console.log(
      `  ${cat}: ${catPassed}/${catResults.length} passed`
    );
  }

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log("\n❌ Failed tests:");
    failed.forEach((r) => console.log(`  - ${r.name} (${r.category})`));
  }

  console.log("");
  process.exit(passed === total ? 0 : 1);
}

runTests();
