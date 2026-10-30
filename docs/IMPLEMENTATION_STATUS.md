# Implementation status

## Phase 1 — foundation increment

- [x] Empty workspace inspected; no existing source to preserve.
- [x] Multi-tenant and fictional-data defaults documented.
- [x] Next.js App Router, TypeScript, Tailwind, and ESLint project shell created manually because the generator rejects this workspace folder name as an npm package name.
- [x] Restrictive default-deny Firestore and Storage rules added.
- [x] Firebase client configuration boundary and tenant/branch policy predicate added.
- [x] Server-only Firebase Admin initialization, verified session-cookie resolver, and minimal audit-event append helper added as foundations (not yet wired to route handlers or provisioned users).
- [x] Unit tests for policy allow/deny conditions added.
- [x] Initial architecture, security, and setup documentation added.

## Not complete

No Authentication UI or server session verification, tenant provisioning, trusted permission store, Cloud Functions/server handlers, audit event persistence, App Check, emulator rules tests, demo-data seeder, feature workflows, integrations, deployment, backup setup, security assessment, or compliance review.

## Next safe increment

Install and validate dependencies; then configure Firebase Emulator Suite and write executable Firestore/Storage rules tests. Define identity/session verification and a trusted permission-assignment schema before exposing any protected data. Keep client rules deny-all until tests support narrowly scoped access.

## Phase 1 current state

- [x] Reviewed `everythinginthisdoc.txt`, including the complete modular feature blueprint and the Final Architecture Phase 1 requirements.
- [x] Preserved the default-deny Firestore and Storage rules.
- [x] Added the responsive application shell and DEMO-labelled operational interface.
- [x] Added login, route-state, loading, error, and not-found boundaries.
- [x] Added initial Phase 1 domain Zod schemas and server-only session resolution boundaries.
- [x] Added safe placeholder environment-variable documentation.
- [x] Added installable PWA shell metadata and offline shell caching; clinical data synchronization is not implemented.
- [ ] Firebase credentials and emulator configuration are environment-specific and require operator configuration.
- [ ] Secure session-cookie endpoints and Firebase sign-in actions require configured credentials.
- [ ] Emulator authorization tests are not yet runnable without Firebase CLI, Java, and an emulator project.
- [ ] Live protected data is intentionally unavailable behind default-deny rules.
- [x] Added environment validation for browser Firebase configuration.
- [x] Added verified Firebase ID-token to HttpOnly, Secure-in-production session cookie route.
- [x] Added login client integration and generic authentication errors.
- [x] Added static committed-rule regression tests.
- [ ] Emulator runtime tests and live Auth/Firebase project configuration remain external blockers.
