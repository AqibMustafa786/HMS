import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

export const runtime = "nodejs";

export async function POST() {
  const store = await cookies();
  const principal = await resolveTrustedPrincipal(store.get("__session")?.value ?? "");
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { db } = getFirebaseAdmin();
  await db.collection("presence").doc(principal.uid).set({
    online: true,
    lastSeenAt: FieldValue.serverTimestamp(),
    tenantId: principal.tenantId,
  }, { merge: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  const principal = await resolveTrustedPrincipal(store.get("__session")?.value ?? "");
  if (!principal) return NextResponse.json({ ok: true });
  const { db } = getFirebaseAdmin();
  await db.collection("presence").doc(principal.uid).set({
    online: false,
    lastSeenAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return NextResponse.json({ ok: true });
}
