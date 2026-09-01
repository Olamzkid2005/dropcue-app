# Adversarial user scenarios

## Observed result

The current app has public/API tests and payment-chaos checks, but no single focused checklist for hostile user behavior. Real payment checkout and authenticated creator actions require provider credentials or a test account, so those paths must not be represented as verified by anonymous tests.

## Acceptance criteria

- Duplicate and malformed requests do not produce a server error.
- Invalid URL identifiers are rejected safely.
- Oversized upload metadata is rejected before storage work.
- An aborted request does not leave the server unusable.
- Public-page refreshes remain deterministic.
- Authenticated/payment-dependent cases have an explicit reproducible procedure and a clear pass condition.

## Automated now

Run:

```bash
npx tsx tests/adversarial-user.test.ts
```

| Scenario | Automated check | Pass condition |
| --- | --- | --- |
| Submit the same request twice | Two concurrent checkout requests with the same invalid product | Both return a controlled 4xx response; no 5xx |
| Change IDs in URLs | Invalid checkout ID | HTTP 400, no database lookup error |
| Refresh during checkout | Three concurrent refreshes of a missing public product | All return the same HTTP 404 |
| Upload ridiculous files | 10 GB upload metadata | HTTP 400 before upload work |
| Internet interruption | Abort a checkout request, then issue another request | Follow-up request still returns normally |
| Duplicate webhook delivery | Ten concurrently signed unknown webhooks | All are acknowledged with 2xx |

## Fixture-gated scenarios

These require a disposable authenticated test account and must be run only against a sandbox/test provider. They are not claimed by the anonymous test above.

| Scenario | Procedure | Pass condition |
| --- | --- | --- |
| Double-click buttons | On the authenticated create-product and checkout forms, double-click the primary action rapidly | One order/product action is created; button disables while pending; no duplicate charge/order |
| Refresh during a real checkout | Start a sandbox checkout, refresh before redirect completes | At most one pending order/session remains; payment can still resolve to one delivery |
| Same request twice | Replay the exact checkout request and replay the provider webhook | Idempotency prevents duplicate provider sessions/deliveries |
| Two devices | Sign in to the same account in two isolated browser contexts; edit/publish/delete from both | RLS blocks cross-user access and concurrent updates do not create duplicate records |
| Network loss during upload | Disable network after the signed URL response but before PUT completion | UI shows a recoverable failed upload; no file is marked uploaded unless completion succeeds |

## Non-objectives

- No production payment calls.
- No destructive database cleanup or deletion of user accounts without an explicit confirmation codeword.
- No new test framework, queue, offline subsystem, or broad E2E matrix.
- No claim that anonymous boundary tests prove authenticated multi-device behavior.
