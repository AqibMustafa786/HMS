import { applicationDefault, cert } from "firebase-admin/app";

export function getServerCredential() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return applicationDefault();

  let parsed;
  try {
    const escapedNewlines = json.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("(?=\s*,))/g,
      (_match, opening, key, closing) => `${opening}${key.replace(/\r?\n/g, "\\n")}${closing}`,
    );
    parsed = JSON.parse(escapedNewlines.trim().replace(/\\n/g, "\n"));
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required service-account fields.");
  }
  return cert(parsed);
}
