import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";
import { canAccessResource } from "@/lib/authorization/policy";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const createSchema = z.object({
  patientId: z.string().trim().regex(/^PT-[A-Z0-9]{10}$/),
  doctorUid: z.string().trim().min(1).max(128),
  date: z.string().date(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(15).max(240),
  reason: z.string().trim().min(1).max(160),
  location: z.string().trim().max(120).optional(),
});

async function principal() {
  const store = await cookies();
  return resolveTrustedPrincipal(store.get("__session")?.value ?? "");
}

export async function POST(request: NextRequest) {
  const current = await principal();
  if (!current) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canAccessResource(current, { tenantId: current.tenantId }, "appointments.create")) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }
  const input = createSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid appointment data.", details: input.error.flatten() }, { status: 400 });

  const { db } = getFirebaseAdmin();
  const [patient, doctor] = await Promise.all([
    db.collection("patients").doc(input.data.patientId).get(),
    db.collection("users").doc(input.data.doctorUid).get(),
  ]);
  if (!patient.exists || patient.data()?.tenantId !== current.tenantId) return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  if (!doctor.exists || doctor.data()?.tenantId !== current.tenantId || doctor.data()?.role !== "doctor") {
    return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
  }

  const startsAt = new Date(`${input.data.date}T${input.data.time}:00`);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Appointment time must be in the future." }, { status: 400 });
  }
  const endsAt = new Date(startsAt.getTime() + input.data.durationMinutes * 60_000);
  const appointmentId = randomUUID();
  await db.collection("appointments").doc(appointmentId).set({
    appointmentId,
    tenantId: current.tenantId,
    patientId: input.data.patientId,
    patientUid: patient.data()?.patientUid ?? null,
    doctorUid: input.data.doctorUid,
    startsAt,
    endsAt,
    reason: input.data.reason,
    location: input.data.location ?? null,
    state: "booked",
    createdByUid: current.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection("auditEvents").doc().set({
    tenantId: current.tenantId,
    actorUid: current.uid,
    action: "appointment.created",
    resourceType: "appointments",
    resourceId: appointmentId,
    occurredAt: FieldValue.serverTimestamp(),
    metadata: { patientId: input.data.patientId, doctorUid: input.data.doctorUid },
  });
  return NextResponse.json({ created: true, appointmentId }, { status: 201 });
}

export async function GET() {
  const current = await principal();
  if (!current) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection("appointments").where("tenantId", "==", current.tenantId).get();
  const appointments = snapshot.docs
    .filter((doc) => current.permissions.includes("*") || doc.data().doctorUid === current.uid || doc.data().patientUid === current.uid)
    .map((doc) => {
      const data = doc.data();
      return { ...data, appointmentId: doc.id, startsAt: data.startsAt?.toDate?.().toISOString() ?? null, endsAt: data.endsAt?.toDate?.().toISOString() ?? null };
    });
  return NextResponse.json({ appointments });
}
