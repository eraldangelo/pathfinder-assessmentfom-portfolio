# Assessment Form

Assessment is a Next.js wizard that collects student intake details and writes leads into Firestore through Firebase Admin API routes.

## Stack

- Next.js 16
- React 18
- Firebase Admin SDK
- Cloudflare Turnstile
- Rate limiting with optional Upstash Redis distributed backing
- Zod shared schema validation
- Playwright smoke E2E
- Firestore emulator integration tests
- Java parity tests (JUnit)

## Local setup

1. Use Node.js 20+.
2. Copy `.env.example` to `.env.local` and fill values.
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local app (default: `localhost:3000`).

If local dev gets stuck on `Compiling /api/check-duplicate ...`, reset Turbopack cache and restart:

```bash
npm run dev:fresh
```

## Environment variables

Required:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `FIREBASE_ADMIN_SDK_JSON` (preferred: JSON string or absolute file path)

Fallback (if not using `FIREBASE_ADMIN_SDK_JSON`):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Optional:

- `FIREBASE_STORAGE_BUCKET`
- `APP_CANONICAL_HOST`
- `UPSTASH_REDIS_REST_URL` (enables distributed rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` (enables distributed rate limiting)
- `TURNSTILE_EXPECTED_ACTION` (default: `assessment_submit`)
- `TURNSTILE_EXPECTED_HOSTNAMES` (comma-separated)
- `TRUST_PROXY_HEADERS`
- `TRUST_CLOUDFLARE_CONNECTING_IP` (default: `false`, explicit opt-in only)
- `ASSESSMENT_ENABLE_LEGACY_FALLBACKS` (default: `true`)
- `ASSESSMENT_LOG_INDEXED_PRECHECKS` (default: `false`)
- `RESUME_QUARANTINE_RETENTION_DAYS` (default: `30`)

## Validation commands

- `npm run typecheck`
- `npm run lint`
- `npm run check:max-lines`
- `npm run check:secrets`
- `npm run check:unused-exports`
- `npm run check:required-docs`
- `npm run check:env-example`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:java`
- `npm run test:regression`
- `npm run build`
- `npm run verify`
- `npm run test:e2e:smoke`
- `npm run verify:smoke`
- `npm run postdeploy:check`
- `npm run doctor`
- `npm run backfill:lead-indexes -- --dry-run`
- `npm run ops:resume-scan:decide -- --queue-doc-id <id> --decision <clean|reject>`
- `npm run ops:resume-scan:cleanup`
- `npm run ops:erase:lead -- --lead-id <id>`

## CI workflows

- `.github/workflows/quality-gate.yml`
- `.github/workflows/security-gate.yml`
- `.github/workflows/postdeploy-uptime-check.yml`
- `.github/workflows/dependabot-triage.yml`
- `.github/workflows/label-sync.yml`
- `.github/workflows/stale.yml`

## Deploy (Cloud Run)

Canonical command:

```bash
npm run deploy:prod
```

What it does:

1. Reads current Cloud Run env + secret bindings from `assessment-form-service`.
2. Reapplies build-time `NEXT_PUBLIC_*` config.
3. Reapplies runtime env + secret bindings.
4. Deploys to existing Cloud Run service in `asia-southeast1`.
5. Runs post-deploy endpoint checks and runtime env sanity checks.

## Data/index migration

After rollout of deterministic indexes, run:

```bash
firebase deploy --only firestore:indexes --project your-gcp-project-id
npm run backfill:lead-indexes -- --dry-run
npm run backfill:lead-indexes
```

This backfills `normalizedEmail`, `normalizedMobile`, and `duplicateKey` plus deterministic index collections.

After validating migration in production, broad compatibility fallbacks can be retired via:

```bash
ASSESSMENT_ENABLE_LEGACY_FALLBACKS=false
```

## Operations docs

- `docs/BLUEPRINT.md`
- `docs/SMOKE_TEST.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/INCIDENT_RUNBOOK.md`
- `docs/SECURITY.md`
- `docs/SUPPORT.md`
- `docs/OPERATIONS_HANDOVER.md`
- `docs/LOGIC_CONTRACT.md`
- `docs/GITHUB_BRANCH_PROTECTION.md`
- `docs/DATA_GOVERNANCE.md`
- `docs/adr/README.md`

## Known Limitations / Future Work

- Duplicate and contact checks are only as strong as normalized inputs and current matching rules; unusual name/format variants can still require rule updates.
- Resume/upload behavior depends on current optional upload flow assumptions; storage and payload guardrails should be reviewed before expanding upload scope.
- Branch contact and consultation configuration remains centralized constants-driven logic; operational changes require config maintenance even when form UI is unchanged.
- Intake validation and workflow gating are intentionally strict on critical submit checks but still have extension points for future qualification rules.
- External integrations that target Firebase App Hosting domains (`*.hosted.app`) can be affected by resolver-specific DNS `NXDOMAIN`; treat as dependency DNS incident and follow `docs/INCIDENT_RUNBOOK.md`.

Reference for critical behavior expectations:
- `docs/BLUEPRINT.md`
- `docs/LOGIC_CONTRACT.md`

