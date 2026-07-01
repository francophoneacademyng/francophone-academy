# Production Checklist

- Enable Blaze plan for Cloud Functions validation
- Run `firebase deploy --only functions --dry-run` and resolve issues
- Ensure environment secrets are set in CI
- Run smoke tests against deployed hosting
