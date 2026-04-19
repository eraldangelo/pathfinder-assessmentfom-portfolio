# GitHub Branch Protection (main)

Recommended branch protection for `main`:

1. Require pull request before merging.
2. Require status checks:
   - `Quality Gate / verify`
   - `Quality Gate / integration`
   - `Quality Gate / java-tests`
   - `Quality Gate / smoke`
3. Require branch up to date before merge.
4. Dismiss stale approvals when new commits are pushed.
5. Restrict force pushes and deletions.

Optional but recommended:

- Require CODEOWNERS review.
- Require conversation resolution before merge.
