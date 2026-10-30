# Data model status

No clinical, patient, financial, staff, or tenant collections are enabled yet. This is deliberate: data collections and query indexes must not precede the tenant and authorization design.

When introduced, each entity specification must document fields and types, required values, tenant/branch ownership, relationships, lifecycle transitions, query patterns/indexes, retention, and audit requirements. Use bounded documents rather than unbounded history arrays. Authoritative IDs and timestamps must be assigned by trusted backend operations.

Initial planned domains include tenants, branches, users, permission assignments, departments, patients, encounters, appointments, audit events, and documents. This list is a roadmap, not an implemented schema.
