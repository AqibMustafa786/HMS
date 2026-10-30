# Permissions matrix status

A role catalog and operational permission matrix are not implemented yet. Do not assign access based only on navigation visibility or client state.

The current pure policy helper checks active account status, tenant match, explicit permission, and branch assignment. It is not yet wired to Firebase Authentication, trusted assignment storage, patient assignment checks, or an API handler. Do not use it as standalone production authorization.

Next step: define capability names and role-to-permission assignments with hospital stakeholders; then build trusted identity/session verification and resource-level checks. Test both authorized and denied cases, including cross-tenant document IDs.
