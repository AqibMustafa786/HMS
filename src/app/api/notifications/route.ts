import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  const principal = await resolveTrustedPrincipal(store.get("__session")?.value ?? "");
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection("notifications")
    .where("recipientUid", "==", principal.uid)
    .where("read", "==", false)
    .limit(20)
    .get();
  const notifications = snapshot.docs.map((notification) => ({
    notificationId: notification.id,
    ...notification.data(),
    createdAt: notification.data().createdAt?.toDate?.().toISOString() ?? null,
  }));
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const store = await cookies();
  const principal = await resolveTrustedPrincipal(store.get("__session")?.value ?? "");
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { notificationId, senderUid } = await request.json() as { notificationId?: string; senderUid?: string };
  const { db } = getFirebaseAdmin();
  if (senderUid) {
    const snapshot = await db.collection("notifications")
      .where("recipientUid", "==", principal.uid)
      .where("read", "==", false)
      .limit(100)
      .get();
    const batch = db.batch();
    let count = 0;
    snapshot.docs.forEach((notification) => {
      if (notification.data().senderUid === senderUid) {
        batch.update(notification.ref, { read: true, readAt: new Date() });
        count += 1;
      }
    });
    if (count > 0) await batch.commit();
    return NextResponse.json({ ok: true, count });
  }
  if (!notificationId) return NextResponse.json({ error: "Notification is required." }, { status: 400 });
  const ref = db.collection("notifications").doc(notificationId);
  const notification = await ref.get();
  if (!notification.exists || notification.data()?.recipientUid !== principal.uid) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }
  await ref.update({ read: true });
  return NextResponse.json({ ok: true });
}
