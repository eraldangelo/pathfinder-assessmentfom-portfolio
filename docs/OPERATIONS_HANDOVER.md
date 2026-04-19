# Operations Handover

Purpose: transfer Assessment ownership with minimum tribal knowledge.

## 1) Critical facts

- Runtime: Node.js 20
- Hosting: Google Cloud Run
- Service: `assessment-form-service`
- Canonical URL: `<your-production-url>`
- Main branch: `main`

## 2) Required secrets

- `TURNSTILE_SECRET_KEY`
- `FIREBASE_ADMIN_SDK_JSON`

Optional distributed rate-limit config:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 3) Core gates

- `npm run verify`
- `npm run test:e2e:smoke`
- `npm run test:integration`
- `npm run test:java`
- `npm run postdeploy:check`

## 3.1) External Dependencies (Non-Code)

Submission reliability depends on external services/config that must stay healthy and correctly configured:

- Cloudflare Turnstile:
  - site key + secret pairing
  - verification endpoint behavior and error handling expectations
- Firebase Admin / Firestore:
  - admin credential availability
  - write permissions and collection/index/rules alignment
- Cloud Run deployment environment:
  - service config, runtime env, and revision health
  - canonical URL and postdeploy endpoint accessibility
- External App Hosting dependencies (`*.hosted.app`) when integrated:
  - DNS resolution can vary by resolver path
  - keep a tested fallback URL and DNS check procedure in `docs/INCIDENT_RUNBOOK.md`
- Production env/secret management:
  - required secrets/env values present and rotated safely
  - deploy pipeline still reapplying runtime bindings correctly
- Deterministic lead index health:
  - if historical records are missing `normalizedEmail` / `normalizedMobile` / `duplicateKey`, run `npm run backfill:lead-indexes`
  - retire broad legacy fallbacks only after verification by setting `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=false`
  - watch precheck mode logs (`[duplicate-precheck] lookup-mode`, `[contact-usage-precheck] lookup-mode`)

Keep credentials in secret managers/ops inventory, not in repository docs.

## 4) Release flow

1. Merge to `main`.
2. Ensure quality gate workflow is green.
3. Run `npm run deploy:prod`.
4. Run post-deploy checks and manual smoke.

## 5) Rollback

1. Revert bad commit(s) on `main`.
2. Push revert.
3. Re-run `npm run deploy:prod`.
4. Re-run smoke and postdeploy checks.

## 6) High-risk areas

- Validation logic between steps
- Duplicate/contact checks
- Submit API + Firestore write path
- Consultation date rules
- Resume quarantine + scan queue lifecycle (`docs/DATA_GOVERNANCE.md`)

