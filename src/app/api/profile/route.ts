import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

export const runtime = "nodejs";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(32).optional().default(""),
  title: z.string().trim().max(120).optional().default(""),
  departmentId: z.string().trim().max(120).optional().default(""),
  preferences: z.object({
    appointmentUpdates: z.boolean().optional(),
    clinicalMessages: z.boolean().optional(),
    requireRecentAuth: z.boolean().optional(),
  }).optional(),
});

async function getPrincipal() {
  const store = await cookies();
  return resolveTrustedPrincipal(store.get("__session")?.value ?? "");
}

export async function GET() {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { auth, db } = getFirebaseAdmin();
  const [account, snapshot] = await Promise.all([
    auth.getUser(principal.uid),
    db.collection("users").doc(principal.uid).get(),
  ]);
  const profile = snapshot.data() ?? {};

  return NextResponse.json({
    profile: {
      uid: principal.uid,
      email: account.email ?? profile.email ?? "",
      displayName: account.displayName ?? profile.displayName ?? "",
      phone: profile.phone ?? "",
      role: profile.role ?? "user",
      title: profile.title ?? "",
      departmentId: profile.departmentId ?? "",
      preferences: profile.preferences ?? {},
      photoURL: account.photoURL ?? "",
      emailVerified: account.emailVerified,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const input = profileSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid profile information.", details: input.error.flatten() }, { status: 400 });

  const { auth, db } = getFirebaseAdmin();
  const userRef = db.collection("users").doc(principal.uid);
  const current = await userRef.get();
  const isSuperadmin = current.data()?.role === "superadmin";

  await auth.updateUser(principal.uid, { displayName: input.data.displayName });
  await userRef.set({
    displayName: input.data.displayName,
    phone: input.data.phone,
    ...(isSuperadmin ? {} : { title: input.data.title, departmentId: input.data.departmentId }),
    preferences: input.data.preferences ?? current.data()?.preferences ?? {},
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
