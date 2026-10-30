import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

const roleSchema = z.enum(["admin", "doctor", "patient"]);
const requestSchema = z.object({
  action: z.enum(["grant", "revoke"]),
  uid: z.string().trim().min(1).max(128),
  role: roleSchema,
});

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const principal = await resolveTrustedPrincipal(cookieStore.get("__session")?.value ?? "");
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { auth, db } = getFirebaseAdmin();
  const superadmin = await db.collection("superadmins").doc(principal.uid).get();
  if (!superadmin.exists || superadmin.data()?.status !== "active") {
    return NextResponse.json({ error: "Only a superadmin can manage roles." }, { status: 403 });
  }

  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid role request." }, { status: 400 });
  if (input.data.role !== "admin" && input.data.action === "revoke" && input.data.uid === principal.uid) {
    return NextResponse.json({ error: "Superadmins cannot be managed through another role." }, { status: 400 });
  }

  const account = await auth.getUser(input.data.uid).catch(() => null);
  if (!account) return NextResponse.json({ error: "User account not found." }, { status: 404 });
  const roleCollection = input.data.role === "admin" ? "admins" : `${input.data.role}s`;
  const roleRef = db.collection(roleCollection).doc(input.data.uid);
  const claims = { ...(account.customClaims ?? {}) };

  if (input.data.action === "revoke") {
    await roleRef.delete();
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
    await roleRef.set({
      uid: input.data.uid,
      email: account.email ?? null,
      tenantId: principal.tenantId,
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
