# Logic Contract

This document defines behavior that must remain stable unless explicitly changed.

## Wizard flow contract

- Step sequence and required fields stay unchanged.
- Step validation must block progression until required values are valid.
- Privacy notice gate remains required before progression.

## Duplicate/contact contract

- Duplicate check uses:
  - `fullName`
  - `dateOfBirth`
- Duplicate result is resolved through deterministic `duplicateKey` lookup:
  - `sha256(normalizedFullName|dateOfBirth)`
- Contact usage check uses normalized:
  - `emailAddress`
  - `mobileNumber`
- Contact usage is resolved through deterministic index docs plus bounded compatibility fallback queries.
- Broad legacy fallbacks remain enabled by default and can be retired explicitly with `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=false` after backfill verification.
- API response shapes remain:
  - duplicate success: `{ ok: true, exists, branch }`
  - contact success: `{ ok: true, emailInUse, mobileInUse }`
- Precheck backend exceptions must fail closed (`ok: false`, 5xx) and never return fake clean results.
- Wizard progression must not silently advance when prechecks fail; users should retry explicitly.

## Consultation contract

- Consultation method/time values must come from shared constants.
- Date rules:
  - non-office-now methods require tomorrow-or-later weekday logic

## Submit contract

- Missing captcha token must fail (`400`).
- Invalid/expired captcha must fail (`403`) with stable error semantics.
- Submit action must enter loading state (spinner + disabled controls) to prevent duplicate sends.
- Submit timeout must be explicit and retriable:
  - default submissions: `60s`
  - resume-attached submissions: `180s`
- Successful submit writes lead record and deterministic contact/duplicate indexes atomically, then triggers recipient notifications.

## Security contract

- API guards (request size/rate limit/body shape) must not alter normal valid flows.
- Rate limiting must degrade gracefully to in-memory fallback when distributed Redis config is absent/unavailable.
- Security headers and canonical host redirect remain active in production.
