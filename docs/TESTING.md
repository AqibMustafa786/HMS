# Testing

Run `npm test`, `npm run lint`, and `npm run typecheck`.

The current Vitest suite covers the pure tenant/branch permission predicate and committed default-deny rule regressions. It does not launch Firebase emulators.

Before enabling client rules, run emulator-backed tests for unauthenticated access, cross-tenant access, branch restrictions, prohibited field changes, and authorized minimal access. Use:

```text
firebase emulators:start --only auth,firestore,storage --project demo-hms
npm run test:rules
```

Add workflow, integration, and end-to-end coverage as corresponding features are implemented. No result should be treated as evidence of clinical validation or production security.
