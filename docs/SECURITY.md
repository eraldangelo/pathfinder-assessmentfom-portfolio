# Security

Assessment follows rolling releases from `main` with advisory + blocking security checks.

## Supported version

- Latest `main` deployment on Cloud Run (`assessment-form-service`)

## Security controls

- Turnstile verification enforced on submit API
- Firebase Admin credentials loaded server-side only
- API request hardening:
  - request size guard
  - rate limiting (Upstash Redis when configured; in-memory fallback otherwise)
  - explicit IP-header trust controls (`TRUST_PROXY_HEADERS`, `TRUST_CLOUDFLARE_CONNECTING_IP`)
  - JSON body shape validation
  - outbound host allowlist (`safeFetch`) for external verification calls
- Response hardening:
  - CSP, frame/content-type/referrer/permissions/HSTS headers
  - canonical run.app redirect in production
- Data protection:
  - deterministic duplicate/contact indexes (`duplicateKey`, normalized email/mobile)
  - sensitive draft data shifted to reduced session-scoped persistence
- Upload hardening:
  - extension + MIME + magic-byte checks
  - quarantine-first storage path and scan queue (`resumeScanQueue`)
  - explicit scan lifecycle statuses (`pending`, `clean_promoted`, `rejected_deleted`, `expired_deleted`)
- Repository hardening:
  - secret scanning script
  - dependency review workflow
  - npm audit advisory workflow

## Reporting vulnerabilities

- Private report: `security@example.com`
- Do not file public GitHub issues for security vulnerabilities.

## Operational expectations

- Keep secrets in Secret Manager, not repo files.
- Run `npm run verify:smoke` before release.
- Run `npm run test:integration` and `npm run test:java` before release.
- Run `npm run deploy:prod` for production deploy consistency.
- Watch precheck mode logs:
  - `[duplicate-precheck] lookup-mode`
  - `[contact-usage-precheck] lookup-mode`
- Keep `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=true` until index backfill verification is complete.

## Recent Hardening Snapshot (2026-04-07)

- Dependency hardening:
  - pinned `next` / `eslint-config-next` to `16.1.7`
  - added overrides for `node-forge`, `fast-xml-parser`, `brace-expansion`
- Verification status:
  - `npm run verify` -> PASS
  - `npm run test:e2e:smoke` -> PASS
- `npm audit --omit=dev` residual is low-severity transitive Firebase/Google chain (`@tootallnate/once`); no high/critical app-level production advisories remain.

## Recent Hardening Snapshot (2026-04-10)

- Validation + index hardening:
  - shared Zod schema for client/server validation parity
  - deterministic `duplicateKey` + normalized contact fields on write
  - deterministic lead index collections for duplicate/contact lookups
- API protection hardening:
  - distributed rate limiting support (Upstash Redis) with safe local fallback
  - trusted proxy IP handling guidance
  - stricter Turnstile verification context checks (action/hostname)
- Upload hardening:
  - extension + MIME + magic-byte checks
  - quarantine upload path + scan queue enforcement hook
- Privacy hardening:
  - reduced browser draft persistence (session-scoped, no long-lived full PII set)

