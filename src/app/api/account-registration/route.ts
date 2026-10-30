import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

const schema = z.object({
  idToken: z.string().min(1).max(4096),
  role: z.enum(["patient", "doctor"]),
  fullName: z.string().trim().min(2).max(120),
  registrationNumber: z.string().trim().min(2).max(80).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid registration information." }, { status: 400 });

  try {
    const { auth, db } = getFirebaseAdmin();
    const claims = await auth.verifyIdToken(input.data.idToken, true);
    if (!claims.email) return NextResponse.json({ error: "Email verification is required." }, { status: 400 });
    if (!claims.email_verified) return NextResponse.json({ error: "Verify your email address before submitting registration." }, { status: 403 });

    const userRef = db.collection("users").doc(claims.uid);
    if (input.data.role === "patient") {
      await userRef.set({
        uid: claims.uid,
        email: claims.email.toLowerCase(),
        displayName: input.data.fullName,
        tenantId: process.env.FIREBASE_PROJECT_ID ?? "hms-careflow",
        branchIds: ["main"],
        permissions: ["appointments.read", "appointments.create", "documents.read"],
        role: "patient",
        status: "active",
        emailVerified: Boolean(claims.email_verified),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await auth.setCustomUserClaims(claims.uid, { role: "patient", patient: true });
    } else {
      await db.collection("pendingDoctorApplications").doc(claims.uid).set({
        uid: claims.uid,
        email: claims.email.toLowerCase(),
        displayName: input.data.fullName,
        registrationNumber: input.data.registrationNumber ?? null,
        tenantId: process.env.FIREBASE_PROJECT_ID ?? "hms-careflow",
        state: "pending",
        emailVerified: Boolean(claims.email_verified),
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await userRef.set({
        uid: claims.uid,
        email: claims.email.toLowerCase(),
        displayName: input.data.fullName,
        tenantId: process.env.FIREBASE_PROJECT_ID ?? "hms-careflow",
        branchIds: [],
        permissions: [],
        role: "pending_doctor",
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await auth.setCustomUserClaims(claims.uid, { role: "pending_doctor" });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Registration could not be submitted." }, { status: 400 });
  }
}
