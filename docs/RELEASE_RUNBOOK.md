# Release Runbook (Cloud Run)

## 1) Preconditions

- Branch is `main` and synced.
- `npm run verify:smoke` passes locally.
- `npm run test:integration` passes locally.
- `npm run test:java` passes locally.
- Quality Gate workflow is green.
- Production target URL remains:
  - `<your-production-url>`

## 2) Release steps

1. Push release commit to `main`.
2. Confirm CI status:
   - `.github/workflows/quality-gate.yml`
   - `.github/workflows/security-gate.yml` (advisory)
3. If this release touches Firestore index config or precheck query fields, deploy indexes first:
   - `firebase deploy --only firestore:indexes --project your-gcp-project-id`
4. Deploy with one command:
   - `npm run deploy:prod`
5. Verify post-deploy:
   - `npm run postdeploy:check`
   - run manual smoke from `docs/SMOKE_TEST.md`
6. Confirm deterministic lead indexes are current (run backfill only if needed):
   - `npm run backfill:lead-indexes -- --dry-run`
   - `npm run backfill:lead-indexes`
7. Keep legacy compatibility fallback enabled until post-backfill verification:
   - `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=true`
8. Confirm resume queue lifecycle is healthy:
   - `npm run ops:resume-scan:cleanup`
9. Confirm scheduled uptime workflow remains healthy:
   - `.github/workflows/postdeploy-uptime-check.yml`

## 3) Manual fallback deploy

If automation is unavailable, run:

```bash
gcloud run deploy assessment-form-service \
  --source="." \
  --region=asia-southeast1 \
  --project=your-gcp-project-id \
  --set-build-env-vars NEXT_PUBLIC_TURNSTILE_SITE_KEY=... \
  --update-env-vars NEXT_PUBLIC_TURNSTILE_SITE_KEY=... \
  --update-secrets TURNSTILE_SECRET_KEY=turnstile-secret-key:latest,FIREBASE_ADMIN_SDK_JSON=firebase-admin-sdk:latest
```

## 4) Rollback

1. Revert bad commit(s) on `main` (no history rewrite).
2. Push revert commit.
3. Run `npm run deploy:prod`.
4. Re-run smoke and postdeploy checks.

