# ADR 0001: Split Smoke and Regression Tests

## Status

Accepted

## Context

Assessment requires two test layers:

- fast confidence checks on every change
- deeper deterministic validation checks

Combining both into one suite slows feedback and makes failures harder to triage quickly.

## Decision

- Keep Playwright smoke focused on core wiring and user-visible paths.
- Keep regression scripts focused on deterministic validation/duplicate/contact logic.
- Run both in CI but keep smoke as a separate job.

## Consequences

- Faster feedback for common regressions.
- Clearer failure ownership (UI wiring vs logic contract).
- Scales better as validation matrix grows.
