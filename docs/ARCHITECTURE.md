# Architecture

## Current foundation

- Next.js App Router and React render the web shell.
- TypeScript is strict and domain code belongs under `src/lib` and `src/features` as modules are added.
- Firebase client configuration is read lazily from public web configuration variables. Public Firebase config is not an authorization boundary.
- Firestore and Storage rules currently deny all client operations. This is intentional until specific read/write access is designed and emulator-tested.
- Authorization policy helpers accept a server-verified principal and trusted resource scope. They must not be constructed from browser-supplied role, tenant, branch, or permission claims.

## Intended trusted data flow

Authenticate the caller, verify session/token server-side, load the active account and permission assignment from trusted storage, check tenant/branch/resource scope, validate input, perform allowed transaction, and write an audit event. Firebase Admin SDK bypasses Firestore rules, so all these steps remain mandatory for trusted backend operations.

## Multi-tenant constraints

All tenant-owned records must have an explicit, server-verified tenant boundary. Branch assignments and patient/resource relationships further restrict access. Never authorize by document ID alone. Introduce schema and indexes only with documented query and permission requirements.

## Deferred decisions

Cloud Functions versus Next.js server handlers for each operation, session-cookie strategy, deployment platform, audit retention backend, and analytics store require a reviewed operational design before implementation.
