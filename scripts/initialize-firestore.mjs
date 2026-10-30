import { existsSync, readFileSync } from "node:fs";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2];
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) throw new Error("Set FIREBASE_PROJECT_ID in .env.local.");
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS to the path of a trusted service-account JSON file.");
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth(app);
const db = getFirestore(app);
const email = process.env.ADMIN_EMAIL ?? "aqib2k1@gmail.com";

const user = await auth.getUserByEmail(email);
await db.collection("users").doc(user.uid).set({
  uid: user.uid,
  email: user.email ?? email,
  emailVerified: user.emailVerified,
  role: "superadmin",
  tenantId: projectId,
  branchIds: ["main"],
  permissions: ["*"],
  status: "active",
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`Initialized users collection and superadmin document: users/${user.uid}`);
