import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";

if (!process.env.SUPERADMIN_PASSWORD && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^SUPERADMIN_PASSWORD=(.*)$/);
    if (match) process.env.SUPERADMIN_PASSWORD = match[1];
  }
}

const email = process.env.ADMIN_EMAIL ?? "aqib2k1@gmail.com";
const projectId = process.env.FIREBASE_PROJECT_ID ?? "hms-careflow";
const password = process.env.SUPERADMIN_PASSWORD;

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log("Using Application Default Credentials. Run: gcloud auth application-default login");
}

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const db = getFirestore();
let user;
try {
  user = await auth.getUserByEmail(email);
  if (password) await auth.updateUser(user.uid, { password, emailVerified: true });
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  if (!password) throw new Error("Set SUPERADMIN_PASSWORD to create the initial superadmin account.");
  user = await auth.createUser({ email, password, emailVerified: true });
}

await auth.setCustomUserClaims(user.uid, { superadmin: true, admin: true, role: "superadmin", hospitalId: projectId });
const commonAssignment = {
  tenantId: projectId,
  branchIds: ["main"],
  permissions: ["*"],
  status: "active",
  email,
  updatedAt: new Date(),
};
await db.collection("users").doc(user.uid).set({ ...commonAssignment, role: "superadmin" }, { merge: true });
await db.collection("superadmins").doc(user.uid).set({
  uid: user.uid,
  email,
  tenantId: projectId,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
}, { merge: true });
await db.collection("admins").doc(user.uid).delete();


console.log(`Administrator configured: ${email} (${user.uid})`);
console.log("Sign out and sign in again to refresh custom claims.");
