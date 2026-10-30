import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

const roleSchema = z.enum(["admin", "doctor", "patient"]);
const requestSchema = z.object({
  action: z.enum(["grant", "revoke", "approve", "reject"]),
  uid: z.string().trim().min(1).max(128),
  role: roleSchema.optional().default("doctor"),
});

async function requireSuperadmin(uid: string) {
  const { db } = getFirebaseAdmin();
  const account = await db.collection("users").doc(uid).get();
  if (!account.exists || account.data()?.role !== "superadmin" || account.data()?.status !== "active") {
    return null;
  }
  return account.data();
}

export async function GET() {
  const cookieStore = await cookies();
  const principal = await resolveTrustedPrincipal(cookieStore.get("__session")?.value ?? "");
  if (!principal || !await requireSuperadmin(principal.uid)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 403 });
  }
  const { db } = getFirebaseAdmin();
  const applications = await db.collection("pendingDoctorApplications")
    .where("state", "==", "pending")
    .get();
  const sortedApplications = applications.docs.sort((left, right) => {
    const leftTime = left.data().submittedAt?.toMillis?.() ?? 0;
    const rightTime = right.data().submittedAt?.toMillis?.() ?? 0;
    return rightTime - leftTime;
  });
  return NextResponse.json({
    applications: sortedApplications.map((application) => ({
      uid: application.id,
      ...application.data(),
      submittedAt: application.data().submittedAt?.toDate?.().toISOString() ?? null,
      updatedAt: application.data().updatedAt?.toDate?.().toISOString() ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const principal = await resolveTrustedPrincipal(cookieStore.get("__session")?.value ?? "");
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { auth, db } = getFirebaseAdmin();
  if (!await requireSuperadmin(principal.uid)) {
    return NextResponse.json({ error: "Only a superadmin can manage roles." }, { status: 403 });
  }

  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid role request." }, { status: 400 });
  if (input.data.role !== "admin" && input.data.action === "revoke" && input.data.uid === principal.uid) {
    return NextResponse.json({ error: "Superadmins cannot be managed through another role." }, { status: 400 });
  }

  const account = await auth.getUser(input.data.uid).catch(() => null);
  if (!account) return NextResponse.json({ error: "User account not found." }, { status: 404 });
  const claims = { ...(account.customClaims ?? {}) };

  if (input.data.action === "approve" || input.data.action === "reject") {
    if (input.data.action === "reject") {
      await db.collection("pendingDoctorApplications").doc(input.data.uid).set({
        state: "rejected",
        reviewedBy: principal.uid,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await db.collection("users").doc(input.data.uid).set({
        status: "disabled",
        role: "pending_doctor",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await auth.setCustomUserClaims(input.data.uid, { role: "pending_doctor" });
      return NextResponse.json({ ok: true, action: "reject", uid: input.data.uid });
    }

    const application = await db.collection("pendingDoctorApplications").doc(input.data.uid).get();
    if (!application.exists || application.data()?.state !== "pending") {
      return NextResponse.json({ error: "Pending doctor application not found." }, { status: 404 });
    }
    await db.collection("users").doc(input.data.uid).set({
      uid: input.data.uid,
      email: account.email ?? application.data()?.email ?? null,
      displayName: application.data()?.displayName ?? account.displayName ?? null,
      registrationNumber: application.data()?.registrationNumber ?? null,
      tenantId: principal.tenantId,
      branchIds: ["main"],
      permissions: ["appointments.read", "appointments.write", "patients.read", "messages.write"],
      role: "doctor",
      status: "active",
      approvedBy: principal.uid,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await db.collection("pendingDoctorApplications").doc(input.data.uid).set({
      state: "approved",
      reviewedBy: principal.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await auth.setCustomUserClaims(input.data.uid, { ...claims, doctor: true, role: "doctor" });
    return NextResponse.json({ ok: true, action: "approve", uid: input.data.uid });
  }

  if (input.data.action === "revoke") {
    delete claims[input.data.role];
    if (input.data.role === "admin") {
      delete claims.admin;
      await auth.setCustomUserClaims(input.data.uid, claims);
    } else {
      claims.role = "user";
      await auth.setCustomUserClaims(input.data.uid, claims);
    }
    await db.collection("users").doc(input.data.uid).set({
      status: "active",
      role: input.data.role === "admin" ? "user" : "user",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } else {
    await db.collection("users").doc(input.data.uid).set({
      uid: input.data.uid,
      email: account.email ?? null,
      tenantId: principal.tenantId,
      role: input.data.role,
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    claims[input.data.role] = true;
    if (input.data.role === "admin") claims.admin = true;
    claims.role = input.data.role;
    await auth.setCustomUserClaims(input.data.uid, claims);
  }
  return NextResponse.json({ ok: true, action: input.data.action, role: input.data.role, uid: input.data.uid });
}
