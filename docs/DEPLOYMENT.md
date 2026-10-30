# Deployment status

No deployment target or Firebase project is configured. Hosting remains intentionally undecided pending server-side architecture and operational requirements.

For local work, use a dedicated development Firebase project or emulators, keep `.env.local` untracked, and configure separate staging and production projects. Never deploy the placeholder `.firebaserc` project. Before any deployment, configure identity, rules, indexes, secrets, App Check, logging, backups, security reviews, and rollback procedures. Deployment has not been tested.
