# Data Governance

This runbook defines coordinated retention and erasure handling for PII-bearing artifacts created by Assessment.

## 1) Artifact Map

- Firestore lead doc: `leads/{leadId}`
- Contact index docs: `leadContactIndex/{email_*|mobile_*}`
- Duplicate index docs: `leadDuplicateIndex/{duplicateKey}`
- Resume object (quarantine): `assessment-resumes/quarantine/*`
- Resume object (clean/promoted): `assessment-resumes/clean/*`
- Resume scan queue docs: `resumeScanQueue/{docId}`

## 2) Resume Scan Lifecycle Contract

Queue collection: `resumeScanQueue`

Status values:

- `pending`: quarantine uploaded, scan decision required
- `scan_error`: scanner attempted but requires reprocessing
- `clean_promoted`: promoted from quarantine to clean path
- `rejected_deleted`: denied and quarantine object deleted
- `expired_deleted`: pending object deleted by retention cleanup

Expected lifecycle:

1. Upload API writes quarantine object + queue doc with `pending`.
2. Scanner (or manual operator) records decision:
   - clean: promote object to clean path and delete quarantine copy
   - reject: delete quarantine object
3. Queue status is updated to a terminal status.

## 3) Operational Commands

Manual scan decision processing:

```bash
npm run ops:resume-scan:decide -- --queue-doc-id <docId> --decision clean --scanner <name> --reason "signature verified"
npm run ops:resume-scan:decide -- --queue-doc-id <docId> --decision reject --scanner <name> --reason "malware detected"
```

Notes:

- Commands are dry-run by default.
- Add `--confirm` to apply changes.

Retention cleanup for stale quarantine artifacts:

```bash
npm run ops:resume-scan:cleanup
npm run ops:resume-scan:cleanup -- --confirm
```

Lead-linked erasure workflow (dry-run first):

```bash
npm run ops:erase:lead -- --lead-id <leadDocId>
npm run ops:erase:lead -- --lead-id <leadDocId> --confirm
```

This erasure flow coordinates:

- lead doc deletion
- matching contact/duplicate index deletion (only when index points to the same lead path)
- linked resume object deletion
- linked scan queue record deletion

## 4) Retention Expectations

- Quarantine retention uses `RESUME_QUARANTINE_RETENTION_DAYS` (default `30`).
- Quarantine objects should not remain indefinitely in `pending`.
- Terminal queue states should be auditable and reviewed periodically.

## 5) Legacy Fallback Retirement Control

Compatibility prechecks remain enabled by default for migration safety.

- `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=true` (default behavior)
- Set `ASSESSMENT_ENABLE_LEGACY_FALLBACKS=false` only after:
  1. backfill is complete (`npm run backfill:lead-indexes`)
  2. integration checks pass
  3. production logs show no compatibility-fallback reliance for expected traffic

## 6) Remaining External Dependency

The scanner worker itself is external to this repo. This repository now provides:

- quarantine + queue contract at upload time
- decision-processing and cleanup scripts
- documented status/retention model

Production enforcement still depends on operating a scanner that writes decisions into the documented lifecycle.
