# Vercel deployment

## Firebase client variables

Configure these variables in Vercel for Production, Preview, and Development:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

These Firebase web values identify the client app. They are public and must also be
configured with Firebase Authentication authorized domains and security rules.

## Server variables

Configure these server-only variables without a `NEXT_PUBLIC_` prefix:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

Use one complete JSON object from a newly rotated service account as the value of
`FIREBASE_SERVICE_ACCOUNT_JSON`. Store it in the Vercel dashboard as a sensitive
encrypted environment variable; never commit it or put it in client code.

In the Firebase console, add the exact Vercel hostname
(`hospital-management-system-three-chi.vercel.app`) to Authentication > Settings >
Authorized domains. Environment variable changes require a new Vercel deployment.

Before deploying, verify:

- `FIREBASE_PROJECT_ID` exactly matches `project_id` in the service-account JSON.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `FIREBASE_PROJECT_ID` identify the same Firebase project.
- The service-account JSON is valid JSON and includes `project_id`, `client_email`, and `private_key`.
- The Vercel variables are enabled for the Production environment.
- A production deployment has been created after adding or changing the variables.

For local provisioning, set `GOOGLE_APPLICATION_CREDENTIALS` to an absolute path
outside the repository instead.

## Firebase rules and indexes

Deploy rules from a trusted machine after setting Firebase CLI credentials:

```powershell
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Rotate any service-account key that has appeared in chat, screenshots, Git history,
logs, environment files copied into tickets, or source code.
