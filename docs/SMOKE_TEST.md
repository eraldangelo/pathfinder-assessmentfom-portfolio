# Smoke Test

## 1) Automated smoke (required)

```bash
npm run verify
npm run test:e2e:smoke
npm run test:integration
npm run test:java
```

Pass criteria:

- Verify pipeline passes (typecheck, lint, max-lines, secret/docs/env checks, unit/regression, build)
- Smoke E2E passes
- Firestore emulator integration tests pass
- Java parity tests pass

Local note:

- `npm run test:e2e:smoke` performs a safe stale `.next/dev/lock` cleanup when no local dev server is listening on smoke port `4173`.

## 2) Smoke E2E coverage

- Happy path submission flow
- Duplicate submission modal flow
- Security headers present on page/API responses
- Submit endpoint rejects missing captcha token

## 3) Manual checks (required before release)

- Fill each wizard step and verify step validation messages are correct.
- Confirm duplicate modal branch contact is correct.
- Confirm contact-usage warnings appear when expected.
- Confirm submit writes lead to Firestore.

## 4) Production checks

- `npm run postdeploy:check`
- Homepage loads on canonical URL.
- No unexpected security header/CSP regressions in browser console.

## 5) Latest Verified Run

Date: 2026-04-13

Automated results:

- `npm run verify` -> PASS
- `npm run test:e2e:smoke` -> PASS
- `npm run test:integration` -> PASS
- `npm run test:java` -> PASS
