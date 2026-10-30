# Security baseline and limitations

## Implemented

- Firestore and Storage rules deny all client reads and writes by default.
- Firebase browser configuration is loaded lazily and is not treated as a secret or an authorization control.
- A pure authorization predicate checks active status, tenant, branch, and explicit capability using trusted principal inputs; unit tests exercise allow and deny cases.
- `.env.example` contains empty web configuration values only. Server credentials must never be exposed via `NEXT_PUBLIC_*` variables.

## Not implemented or verified

Authentication flows, secure session cookies, staff provisioning, MFA, permission assignment persistence, trusted server handlers/Cloud Functions, App Check, rate limiting, audit event storage, storage upload authorization, emulator rule tests, dependency scanning, monitoring, production headers/CSP, backup and recovery configuration, and independent penetration/security testing.

No patient information may be entered. Technical controls do not establish HIPAA compliance or compliance with any jurisdiction's healthcare/privacy obligations. Obtain qualified security, clinical-safety, legal, and privacy review before production use.

## Rules policy

Do not change default-deny rules to broad authenticated or allow-all access to make the app appear functional. Add a specific rule only with a documented data model, trusted tenant binding, field validation where practical, and emulator tests for both permitted and denied cases. Server Admin SDK code must independently authenticate, authorize, validate, enforce state transitions, and audit.
