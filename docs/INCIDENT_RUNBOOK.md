# Incident Runbook

Purpose: reduce recovery time for production issues in Assessment.

## 1) Severity

- `SEV-1`: submissions blocked for all users
- `SEV-2`: partial degradation (duplicate/contact checks, one step, one branch path)
- `SEV-3`: minor non-blocking issue

## 2) First response

1. Confirm impact scope (all users vs partial).
2. Capture route, timestamp (UTC), and error text.
3. Run endpoint sanity:
   - `npm run postdeploy:check`
4. Assign owner and start timeline notes.

## 3) Diagnostic checklist

- Homepage loads (`/`)
- Wizard step transitions still work
- Duplicate check endpoint returns expected shape
- Contact-usage endpoint returns expected shape
- Precheck fail-closed behavior is active:
  - duplicate/contact precheck internal exceptions should return `ok: false` with 5xx
  - clients should retry prechecks; do not treat these responses as clean/no-conflict
- Precheck mode logs show expected path:
  - `[duplicate-precheck] lookup-mode`
  - `[contact-usage-precheck] lookup-mode`
- Submit endpoint rejects invalid/missing captcha correctly
- Firestore write path works with valid payload
- Deterministic lead index collections (`leadContactIndex`, `leadDuplicateIndex`) are writable/readable
- Upstash rate limiter credentials are present and healthy
- Legacy fallback gate:
  - keep `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=true` until post-backfill validation is complete

Known external DNS risk (`hosted.app` NXDOMAIN):

- This app runs on Cloud Run, but operations may still depend on external Firebase App Hosting URLs (`*.hosted.app`) used by linked tools.
- Symptom:
  - external tool links/open-in-new-tab flows fail with `DNS_PROBE_FINISHED_NXDOMAIN`
  - Assessment app itself remains healthy
- Quick checks:
  - `nslookup <external-hosted-app-domain>`
  - `nslookup <external-hosted-app-domain> 8.8.8.8`
  - compare resolver behavior (local DNS vs public DNS)
- If broken:
  - treat as DNS/resolver-path incident first, not immediate app rollback
  - switch dependent integration URL to reachable domain/region
  - document active URL and fallback in operations docs

## 4) Containment

1. Prefer fast revert on `main`.
2. Redeploy via `npm run deploy:prod`.
3. Notify stakeholders with expected recovery ETA.

## 5) Recovery validation

- `npm run verify:smoke`
- `npm run postdeploy:check`
- Manual submission test on production

Local smoke flake note (`.next/dev/lock`):

- `npm run test:e2e:smoke` now performs a safe stale-lock cleanup before Playwright startup.
- If lock issues persist, ensure no orphan `next dev` process is still running on local port `4173`.

## 6) Postmortem

- Root cause
- Detection gap
- Corrective action
- Owner and due date
