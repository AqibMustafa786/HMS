# Data model

The Firestore database is initialized by `npm run firebase:init`. It does not create
fictional business records.

Operational collections are tenant-scoped and are created by trusted server operations:

- `users`: Firebase UID-indexed identity and role assignments.
- `tenants` / `branches`: organization and facility configuration.
- `patients` / `patientKeys`: patient records and collision-resistant identity indexes.
- `departments`, `doctorProfiles`, `availability`: staff profiles and scheduling.
- `appointments`, `encounters`: visit lifecycle and clinical encounters.
- `patientDocuments`: metadata for files stored in Cloud Storage.
- `conversations`, `messages`: doctor-patient conversations.
- `presence`, `notifications`: real-time status and delivery inboxes.
- `auditEvents`: append-only administrative and clinical audit trail.

Collection contracts are registered in `_collectionSchemas`. Schema metadata is
administrative configuration, not medical or operational dummy data.
