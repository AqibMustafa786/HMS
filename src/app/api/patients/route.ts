import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";
import { canAccessResource } from "@/lib/authorization/policy";
import { generatePatientId, getPatientIdentityKey } from "@/lib/patients/unique-id";

export const runtime = "nodejs";

const createPatientSchema = z.object({
  identityKey: z.string().trim().min(3).max(64),
  givenName: z.string().trim().min(1).max(80),
  familyName: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().date(),
  sex: z.enum(["female", "male", "intersex", "unknown"]),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(254).optional(),
  assignedDoctorUid: z.string().trim().min(1).max(128).optional(),
});

const findPatientSchema = z.object({
  identityKey: z.string().trim().min(3).max(64),
});

async function getPrincipal() {
  const cookieStore = await cookies();
  return resolveTrustedPrincipal(cookieStore.get("__session")?.value ?? "");
}

export async function POST(request: NextRequest) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const action = z.object({ action: z.enum(["create", "find"]) }).safeParse(body);
  if (!action.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (action.data.action === "find") {
    const input = findPatientSchema.safeParse(body);
    if (!input.success) return NextResponse.json({ error: "Invalid patient key." }, { status: 400 });
    if (!canAccessResource(principal, { tenantId: principal.tenantId }, "patients.read")) {
      return NextResponse.json({ error: "Permission denied." }, { status: 403 });
    }

    const { db } = getFirebaseAdmin();
    let key: string;
    try {
      key = getPatientIdentityKey(input.data.identityKey);
    } catch (error) {
      if (error instanceof RangeError || error instanceof TypeError) {
        return NextResponse.json({ error: "Invalid patient key." }, { status: 400 });
      }
      throw error;
    }
    const index = await db.collection("patientKeys").doc(key).get();
    if (!index.exists) return NextResponse.json({ found: false }, { status: 404 });

    const patientId = String(index.data()?.patientId ?? "");
    if (!patientId) return NextResponse.json({ error: "Invalid patient index." }, { status: 500 });
    const patient = await db.collection("patients").doc(patientId).get();
    if (!patient.exists || patient.data()?.tenantId !== principal.tenantId) {
      return NextResponse.json({ error: "Patient record unavailable." }, { status: 404 });
    }
    const data = patient.data()!;
    const isAdmin = principal.permissions.includes("*");
    const isAssignedDoctor = data.assignedDoctorUid === principal.uid;
    const isPatient = data.patientUid === principal.uid;
    if (!isAdmin && !isAssignedDoctor && !isPatient) return NextResponse.json({ error: "Permission denied." }, { status: 403 });

    return NextResponse.json({ found: true, patient: { ...data, id: patientId } });
  }

  const input = createPatientSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: "Invalid patient data.", details: input.error.flatten() }, { status: 400 });
  if (!canAccessResource(principal, { tenantId: principal.tenantId }, "patients.create")) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }

  const { db } = getFirebaseAdmin();
  let keyHash: string;
  try {
    keyHash = getPatientIdentityKey(input.data.identityKey);
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) {
      return NextResponse.json({ error: "Invalid patient key." }, { status: 400 });
    }
    throw error;
  }
  let patientUid: string | null = null;
  if (input.data.email) {
    try {
      const account = await getFirebaseAdmin().auth.getUserByEmail(input.data.email.toLowerCase());
      if (account.emailVerified) patientUid = account.uid;
    } catch {
      patientUid = null;
    }
  }

  try {
    const patientId = await db.runTransaction(async (transaction) => {
      const keyRef = db.collection("patientKeys").doc(keyHash);
      const existing = await transaction.get(keyRef);
      if (existing.exists) throw new Error("DUPLICATE_PATIENT_KEY");

      let newPatientId = generatePatientId();
      let publicIdExists = await transaction.get(db.collection("patients").doc(newPatientId));
      while (publicIdExists.exists) {
        newPatientId = generatePatientId();
        publicIdExists = await transaction.get(db.collection("patients").doc(newPatientId));
      }
      transaction.set(keyRef, {
        patientId: newPatientId,
        tenantId: principal.tenantId,
        keyCreatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("patients").doc(newPatientId), {
        givenName: input.data.givenName,
        familyName: input.data.familyName,
        dateOfBirth: input.data.dateOfBirth,
        sex: input.data.sex,
        phone: input.data.phone ?? null,
        email: input.data.email?.toLowerCase() ?? null,
        patientUid,
        uniqueKeyHash: keyHash,
        mrn: `MRN-${newPatientId.slice(3)}`,
        tenantId: principal.tenantId,
        assignedDoctorUid: input.data.assignedDoctorUid ?? principal.uid,
        createdByUid: principal.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lifecycleState: "active",
      });
      transaction.set(db.collection("auditEvents").doc(), {
        action: "patient.created",
        resourceType: "patients",
        resourceId: newPatientId,
        actorUid: principal.uid,
        tenantId: principal.tenantId,
        occurredAt: FieldValue.serverTimestamp(),
        metadata: { assignedDoctorUid: input.data.assignedDoctorUid ?? principal.uid },
      });
      return newPatientId;
    });
    return NextResponse.json({ created: true, patientId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_PATIENT_KEY") {
      return NextResponse.json({ error: "A patient with this unique key already exists.", code: "DUPLICATE_PATIENT_KEY" }, { status: 409 });
    }
    throw error;
  }
}
