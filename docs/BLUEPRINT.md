# Assessment Blueprint

## Scope

- 6-step assessment wizard
- Duplicate lead guard (name + date of birth)
- Contact-usage guard (email/mobile)
- Optional resume upload
- Firestore lead write + notification fanout
- Deterministic lead indexes + rate limiting (distributed when Upstash is configured)
- Precheck mode telemetry (`indexed` / `compatibility_fallback` / failed route exceptions)

## Architecture

- `app/page.tsx`: shell page
- `components/assessment/*`: UI steps/modals/footer/header
- `lib/assessment/*`: client-side wizard state, validation, shared constants/rules
- `app/api/*`: server routes for submit/personnel/duplicate/contact checks
- `app/api/_shared/*`: reusable API guards (rate-limit, request-size, body parsing, safe outbound fetch)
- `proxy.ts`: security headers + canonical run.app redirect in production
- `lib/assessment/schema.ts`: shared Zod validation source-of-truth (client + server)

## Critical Submission Path (Do Not Break)

1. Wizard input collection:
   - user completes required step fields and privacy gate.
2. Client validation/gating:
   - step progression is blocked until required values are valid.
3. Duplicate/contact pre-checks:
   - duplicate path checks deterministic `duplicateKey` (normalized name + DOB hash)
   - contact path checks deterministic normalized contact indexes
   - both paths can use compatibility fallbacks while `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=true`.
   - backend precheck exceptions fail closed (`ok: false`, 5xx) and require explicit retry; no false all-clear fallback.
4. Captcha verification:
   - missing token fails fast; invalid/expired token fails submit.
5. Server write path:
   - submit API performs guarded Firebase Admin write to Firestore.
6. Post-write fanout:
   - notifications are generated for recipient flow after successful write.
7. Deterministic indexing:
   - lead write updates contact + duplicate indexes in a transaction.

Any changes across these stages should be validated against `docs/LOGIC_CONTRACT.md` and smoke/regression checks before release.

## Source of truth

- Branch and staff-branch mapping: `lib/assessment/constants/branches.ts`
- Consultation methods/times and office-now label: `lib/assessment/constants/consultation.ts`
- Contact directory for modals: `lib/assessment/constants/contacts.ts`
- Phone/email normalization: `lib/assessment/utils/contact.ts`
- Deterministic key/index helpers: `lib/assessment/server/leadIndexKeys.ts`
- Consultation date primitives: `lib/assessment/rules/consultationDate.ts`

## Quality gates

- `npm run verify`: typecheck + lint + max-lines + secret scan + docs/env checks + unit/regression + build
- `npm run test:integration`: Firestore-emulator API integration tests
- `npm run test:java`: JUnit parity tests for deterministic rules
- `npm run test:e2e:smoke`: browser smoke checks
- CI workflow: `.github/workflows/quality-gate.yml`
- advisory security workflow: `.github/workflows/security-gate.yml`
- scheduled uptime checks: `.github/workflows/postdeploy-uptime-check.yml`

## Deployment truth

- Target platform: **Google Cloud Run**
- Runtime secrets: Turnstile + Firebase Admin credentials via Secret Manager
- Canonical release command: `npm run deploy:prod`
