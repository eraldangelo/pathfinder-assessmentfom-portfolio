# Support

## Quick commands

```bash
npm run verify
npm run test:e2e:smoke
npm run test:integration
npm run test:java
npm run postdeploy:check
npm run doctor
```

## Typical issues

1. Submission blocked
   - Check `TURNSTILE_SECRET_KEY` and `FIREBASE_ADMIN_SDK_JSON`.
   - If distributed rate limiting is enabled, check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
   - Run `npm run postdeploy:check`.
   - If UI shows `Submission timed out. Please retry.`, retry once and inspect Cloud Run request latency/logs for `/api/submit`.
   - Resume-attached submissions are allowed a longer timeout window (`180s`) than non-resume submissions (`60s`).
2. Turnstile not loading
   - Check `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
   - Confirm deploy used `npm run deploy:prod`.
3. Duplicate/contact check mismatch
   - Run regression scripts:
     - `npm run test:regression`
     - `npm run test:integration`
   - If precheck returns temporary failure (5xx / unavailable), retry from step 2 using Next; do not treat failed prechecks as clean.
   - If legacy data is missing index fields, run:
     - `npm run backfill:lead-indexes -- --dry-run`
     - `npm run backfill:lead-indexes`
   - Compare behavior against `docs/LOGIC_CONTRACT.md`.
   - Check server logs for precheck mode:
     - `[duplicate-precheck] lookup-mode`
     - `[contact-usage-precheck] lookup-mode`
   - Use `ASSESSMENT_LOG_INDEXED_PRECHECKS=true` temporarily if you need indexed-path baseline logs.
4. Resume scan lifecycle operations
   - Decide pending scans:
     - `npm run ops:resume-scan:decide -- --queue-doc-id <id> --decision <clean|reject>`
   - Cleanup expired quarantine:
     - `npm run ops:resume-scan:cleanup`
   - Coordinated lead erasure dry-run:
     - `npm run ops:erase:lead -- --lead-id <id>`

## Escalation

- Deploy/process issue: `docs/RELEASE_RUNBOOK.md`
- Production incident: `docs/INCIDENT_RUNBOOK.md`
- Security issue: `docs/SECURITY.md`
- Data lifecycle operations: `docs/DATA_GOVERNANCE.md`
