## Summary

- What changed:
- Why:

## Validation

- [ ] `npm run verify`
- [ ] `npm run test:e2e:smoke`
- [ ] `npm run test:integration`
- [ ] `npm run test:java`
- [ ] `npm run postdeploy:check` (if deploy-related)

## Risk Checklist

- [ ] No business logic change unless explicitly intended
- [ ] No UI/UX regressions introduced
- [ ] Duplicate/contact checks still behave correctly
- [ ] Consultation date/time validation still behaves correctly
- [ ] No new source/test/doc file exceeds 250 lines

## Deploy Notes

- [ ] Requires Cloud Run deploy
- [ ] Requires env/secrets change
- [ ] Requires runbook/doc update
