import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

export const runtime = "nodejs";

async function getPrincipal() {
  const store = await cookies();
  return resolveTrustedPrincipal(store.get("__session")?.value ?? "");
}

export async function GET(request: NextRequest) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { db } = getFirebaseAdmin();
  const current = await db.collection("users").doc(principal.uid).get();
  const role = current.data()?.role;
  if (!["superadmin", "admin", "doctor"].includes(role)) {
    return NextResponse.json({ error: "Internal messaging is only available to administrators and doctors." }, { status: 403 });
  }

  const contacts: Array<{ uid: string; displayName: string; role: string; email: string }> = [];
  let doctorQuery;
  if (role === "doctor") {
    doctorQuery = await db.collection("users").where("role", "in", ["superadmin", "admin"]).get();
  } else {
    doctorQuery = await db.collection("users").where("role", "==", "doctor").get();
  }
  for (const contact of doctorQuery.docs) {
    contacts.push({
      uid: contact.id,
      displayName: String(contact.data().displayName ?? contact.data().email ?? "Careflow user"),
      role: String(contact.data().role ?? ""),
      email: String(contact.data().email ?? ""),
    });
  }

  const conversationSnapshot = await db.collection("conversations").where("participantUids", "array-contains", principal.uid).get();
  const conversations = await Promise.all(conversationSnapshot.docs.map(async (conversation) => {
    const data = conversation.data();
    const messages = await db.collection("conversations").doc(conversation.id).collection("messages")
      .orderBy("sentAt", "desc").limit(1).get();
    const last = messages.docs[0]?.data();
    return {
      conversationId: conversation.id,
      participantUids: data.participantUids ?? [],
      title: String(data.title ?? "Careflow conversation"),
      kind: String(data.kind ?? "internal"),
      updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
      lastMessage: last ? {
        body: String(last.body ?? ""),
        senderUid: String(last.senderUid ?? ""),
        sentAt: last.sentAt?.toDate?.().toISOString() ?? null,
      } : null,
    };
  }));

  conversations.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  const contactUid = request.nextUrl.searchParams.get("contactUid");
  let thread: Array<{ messageId: string; senderUid: string; body: string; sentAt: string | null }> = [];
  if (contactUid) {
    const participantUids = [principal.uid, contactUid].sort();
    const conversationId = `${participantUids[0]}_${participantUids[1]}`;
    const conversation = await db.collection("conversations").doc(conversationId).get();
    if (conversation.exists) {
      const messages = await db.collection("conversations").doc(conversationId).collection("messages")
        .orderBy("sentAt", "asc").limit(200).get();
      thread = messages.docs.map((message) => ({
        messageId: message.id,
        senderUid: String(message.data().senderUid ?? ""),
        body: String(message.data().body ?? ""),
        sentAt: message.data().sentAt?.toDate?.().toISOString() ?? null,
      }));
    }
  }
  return NextResponse.json({ contacts, conversations, thread });
}

const sendSchema = z.object({
  contactUid: z.string().trim().min(1).max(128),
  body: z.string().trim().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const input = sendSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Enter a valid message.", details: input.error.flatten() }, { status: 400 });

  const { db } = getFirebaseAdmin();
  const [currentSnapshot, contactSnapshot] = await Promise.all([
    db.collection("users").doc(principal.uid).get(),
    db.collection("users").doc(input.data.contactUid).get(),
  ]);
  const currentRole = currentSnapshot.data()?.role;
  const contactRole = contactSnapshot.data()?.role;
  const allowed =
    (currentRole === "doctor" && ["superadmin", "admin"].includes(contactRole)) ||
    (["superadmin", "admin"].includes(currentRole) && contactRole === "doctor");
  if (!contactSnapshot.exists || !allowed) {
    return NextResponse.json({ error: "This conversation is not authorized." }, { status: 403 });
  }

  const participantUids = [principal.uid, input.data.contactUid].sort();
  const conversationId = `${participantUids[0]}_${participantUids[1]}`;
  const conversationRef = db.collection("conversations").doc(conversationId);
  const names = [
    String(currentSnapshot.data()?.displayName ?? "User"),
    String(contactSnapshot.data()?.displayName ?? "User"),
  ];
  await conversationRef.set({
    participantUids,
    tenantId: principal.tenantId,
    kind: "internal",
    title: names.filter((name, index, values) => values.indexOf(name) === index).join(" & "),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await conversationRef.collection("messages").add({
    senderUid: principal.uid,
    body: input.data.body,
    sentAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true, conversationId }, { status: 201 });
}
