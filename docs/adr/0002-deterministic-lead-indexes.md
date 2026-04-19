# ADR 0002: Deterministic Lead Indexes

## Status

Accepted

## Context

Scan-based duplicate/contact checks (`collectionGroup('leads')`) do not scale well and can miss records with bounded queries.

## Decision

- Store canonical contact fields on lead write:
  - `normalizedEmail`
  - `normalizedMobile`
- Store deterministic duplicate identity:
  - `duplicateKey = sha256(normalizedFullName|dateOfBirth)`
- Maintain dedicated index collections:
  - `leadContactIndex`
  - `leadDuplicateIndex`
- Enforce lead + index writes atomically in submit transaction.
- Provide backfill utility: `npm run backfill:lead-indexes`.

## Consequences

- Predictable, indexed lookups for duplicate/contact checks.
- Better scale and lower latency under growth.
- Requires one-time migration/backfill for historical records.
