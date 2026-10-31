import "server-only";
import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be configured on the server.");
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let credential;
  if (serviceAccountJson) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson.trim());
    } catch {
      try {
        const escapedPrivateKey = serviceAccountJson.replace(
          /("private_key"\s*:\s*")([\s\S]*?)("(?=\s*,))/g,
          (_match, opening, key, closing) => `${opening}${key.replace(/\r?\n/g, "\\n")}${closing}`,
        );
        serviceAccount = JSON.parse(escapedPrivateKey.trim());
      } catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON.");
      }
    }
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id, client_email, or private_key.");
    }
    if (serviceAccount.project_id !== projectId) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON project_id does not match FIREBASE_PROJECT_ID.");
    }
    credential = cert(serviceAccount);
  } else {
    credential = applicationDefault();
  }

  return getApps().length
    ? getApp()
    : initializeApp({ credential, projectId });
}

export function getFirebaseAdmin() {
  const app = getAdminApp();
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
