import "server-only";
import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be configured on the server.");
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential = serviceAccountJson
    ? cert(JSON.parse(serviceAccountJson.replace(/\\n/g, "\n")))
    : applicationDefault();

  return getApps().length
    ? getApp()
    : initializeApp({ credential, projectId });
}

export function getFirebaseAdmin() {
  const app = getAdminApp();
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
