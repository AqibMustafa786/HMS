import "server-only";
import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be configured on the server.");

  return getApps().length
    ? getApp()
    : initializeApp({ credential: applicationDefault(), projectId });
}

export function getFirebaseAdmin() {
  const app = getAdminApp();
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
