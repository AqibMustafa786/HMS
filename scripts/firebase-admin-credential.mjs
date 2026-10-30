import { applicationDefault, cert } from "firebase-admin/app";

export function getServerCredential() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return applicationDefault();

  let parsed;
  try {
    parsed = JSON.parse(json.replace(/\\n/g, "\n"));
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required service-account fields.");
  }
  return cert(parsed);
}
