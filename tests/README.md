# Dropcue Test Suite

All repository tests live in this directory.

## Available Tests

- `api.test.ts` - HTTP smoke checks for public pages and API endpoints.
- `auth-flow.test.ts` - browser checks for login, magic-link flow, auth callbacks, and protected routes.
- `e2e.test.ts` - browser checks for public pages, redirects, API errors, and responsive UI.
- `full-flow.test.ts` - end-to-end product, checkout, delivery, payment, and navigation checks.
- `phase9-comprehensive.test.ts` - broad browser, responsive, loading, error, and feedback checks.
- `payment-chaos.test.ts` - signed webhook failure and duplicate-delivery checks.
- `load-test.ts` - fixture-backed checkout, rate-limit, status, webhook, and fulfillment-race load test.

## Commands

Run the API smoke suite against a running development server:

```bash
node --experimental-strip-types tests/api.test.ts
```

Run a browser suite after setting `PUPPETEER_EXECUTABLE_PATH` to a locally installed Chrome or Chromium executable. The existing browser tests also use `BASE_URL=http://127.0.0.1:3000` by default:

```bash
PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" node --experimental-strip-types tests/e2e.test.ts
PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" node --experimental-strip-types tests/auth-flow.test.ts
PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" node --experimental-strip-types tests/full-flow.test.ts
PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" node --experimental-strip-types tests/phase9-comprehensive.test.ts
```

The payment-chaos suite requires `LOADTEST_WEBHOOK_SECRET`. The load test additionally requires `LOADTEST_SUPABASE_URL` and `LOADTEST_SERVICE_KEY`:

```bash
LOADTEST_WEBHOOK_SECRET=... node --experimental-strip-types tests/payment-chaos.test.ts
LOADTEST_WEBHOOK_SECRET=... LOADTEST_SUPABASE_URL=... LOADTEST_SERVICE_KEY=... node --experimental-strip-types tests/load-test.ts
```

Browser suites may create screenshots under `tests/screenshots/`. Load and chaos tests require a running app and configured test credentials; they are not run automatically by the normal build.
