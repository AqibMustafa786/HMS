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
const now = FieldValue.serverTimestamp();
const batch = db.batch();

const superadminRef = db.collection("users").doc(user.uid);
batch.set(superadminRef, {
  uid: user.uid,
  email: user.email ?? email,
  emailVerified: user.emailVerified,
  role: "superadmin",
  tenantId: projectId,
  branchIds: ["main"],
  permissions: ["*"],
  status: "active",
  createdAt: now,
  updatedAt: now,
}, { merge: true });

batch.set(db.collection("tenants").doc(projectId), {
  tenantId: projectId,
  name: "Careflow HMS",
  status: "active",
  plan: "enterprise",
  defaultTimezone: "Asia/Karachi",
  defaultLocale: "en-PK",
  createdAt: now,
  updatedAt: now,
}, { merge: true });

const collections = {
  users: ["uid", "email", "role", "tenantId", "status", "createdAt", "updatedAt"],
  tenants: ["tenantId", "name", "status", "defaultTimezone", "defaultLocale", "createdAt", "updatedAt"],
  patients: ["patientId", "publicPatientId", "tenantId", "identityKeyHash", "status", "createdAt", "updatedAt", "createdByUid"],
  patientKeys: ["keyHash", "tenantId", "patientDocumentId", "createdAt"],
  departments: ["departmentId", "tenantId", "name", "status", "createdAt", "updatedAt"],
  doctorProfiles: ["doctorUid", "tenantId", "departmentId", "displayName", "specialties", "feeMinor", "currency", "status", "createdAt", "updatedAt"],
  appointments: ["appointmentId", "tenantId", "patientUid", "patientId", "doctorUid", "startsAt", "status", "createdAt", "createdByUid", "updatedAt"],
  encounters: ["encounterId", "tenantId", "patientId", "doctorUid", "appointmentId", "startedAt", "status", "createdAt", "updatedAt"],
  availability: ["availabilityId", "tenantId", "doctorUid", "date", "startsAt", "endsAt", "capacity", "bookedCount", "status"],
  patientDocuments: ["documentId", "tenantId", "patientId", "storagePath", "category", "mimeType", "sizeBytes", "uploadedByUid", "createdAt"],
  conversations: ["conversationId", "tenantId", "patientId", "participantUids", "doctorUid", "status", "lastMessageAt", "createdAt"],
  messages: ["messageId", "tenantId", "conversationId", "senderUid", "messageType", "body", "sentAt", "deliveryStatus"],
  presence: ["uid", "tenantId", "state", "lastSeenAt"],
  auditEvents: ["eventId", "tenantId", "actorUid", "action", "entityType", "entityId", "metadata", "createdAt"],
  notifications: ["notificationId", "tenantId", "recipientUid", "type", "title", "readAt", "createdAt"],
};

for (const [collectionName, fields] of Object.entries(collections)) {
  batch.set(db.collection("_collectionSchemas").doc(collectionName), {
    collection: collectionName,
    version: 1,
    fields,
    tenantScoped: !["users", "_collectionSchemas"].includes(collectionName),
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
}

await batch.commit();
console.log(`Initialized tenant, users collection, and schema registry for ${projectId}`);
console.log(`Superadmin: users/${user.uid}`);
