# Hospital Management System

A phased, multi-tenant hospital operations platform foundation built with Next.js, TypeScript, and Firebase. The current increment establishes the application shell, Firebase client configuration boundary, restrictive baseline rules, and a pure tenant/branch authorization predicate with unit tests.

> **Development foundation only.** Do not use real patient data. This repository is not production-ready or a claim of healthcare regulatory compliance. Clinical safety validation, privacy review, security assessment, cloud configuration, and operational recovery work remain necessary.

## Defaults

- Multi-hospital SaaS architecture, with tenant isolation as a foundational constraint.
- Fictional development data only; no demo patient data has been seeded.
- Hosting decision deferred until server-side requirements and operations are confirmed.
- TypeScript, Next.js App Router, Tailwind CSS, Firebase Auth/Firestore/Storage, and trusted server-side Firebase operations.

## Prerequisites

- Node.js LTS and npm.
- A Firebase project for each environment when cloud services are configured.
- Java runtime if using Firebase Emulator Suite.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and supply Firebase web app configuration for a non-production development project. Never add service-account keys to client environment variables.
3. Run `npm run dev` and open the local address reported by Next.js.
4. Check with `npm run lint`, `npm run typecheck`, and `npm test`.

Firebase client access is not yet enabled in Firestore or Storage: the committed rules deny all client access until each use case has tested, narrow authorization rules and trusted server-side controls. No sign-in, patient workflow, billing, or clinical module is implemented yet.

## Firebase emulators

The emulator ports and rules paths are in `firebase.json`. Install Firebase CLI as a development tool, then run `firebase emulators:start --only auth,firestore,storage --project demo-hms` from this directory. Do not point local tests at a production project. Security rules tests should be added and run against the Firestore and Storage emulators before permitting any client access.

The `.firebaserc` default project is a non-existent local placeholder. Replace it with the intended development project ID only in local configuration; maintain separate staging and production Firebase projects.

## Project scripts

- `npm run dev` — local Next.js development server.
- `npm run build` — production compilation.
- `npm run start` — serve a built application.
- `npm run lint` — ESLint.
- `npm run typecheck` — TypeScript check.
- `npm test` — Vitest unit tests.

## Implementation boundaries

See [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) for what exists and the next safe increment. See [docs/SECURITY.md](docs/SECURITY.md) for current security posture. Firebase credentials, App Check enforcement, Cloud Functions deployment, logging/monitoring, backups, and security-rule testing still require external configuration and implementation. Do not infer security or compliance from the presence of configuration files.

## Phase 1 validation

The application shell and login/session boundaries are implemented. Firebase-dependent behavior requires `.env.local` and a configured development project or emulator:

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Start the local Firebase emulators separately when Java and the Firebase CLI are available:

```powershell
firebase emulators:start --only auth,firestore,storage --project demo-hms
```

The committed Firestore and Storage rules are default-deny. Clinical records and live synchronization are intentionally not enabled until trusted authorization and emulator-backed tests are available.
