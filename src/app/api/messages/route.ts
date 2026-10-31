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

  const contacts: Array<{ uid: string; displayName: string; role: string; email: string; online: boolean; lastSeenAt: string | null }> = [];
  let doctorQuery;
  if (role === "doctor") {
    doctorQuery = await db.collection("users").where("role", "in", ["superadmin", "admin"]).get();
  } else {
    doctorQuery = await db.collection("users").where("role", "==", "doctor").get();
  }
  for (const contact of doctorQuery.docs) {
    const presence = await db.collection("presence").doc(contact.id).get();
    const lastSeen = presence.data()?.lastSeenAt?.toDate?.() ?? null;
    const online = presence.data()?.online === true && lastSeen && Date.now() - lastSeen.getTime() < 90_000;
    contacts.push({
      uid: contact.id,
      displayName: String(contact.data().displayName ?? contact.data().email ?? "Careflow user"),
      role: String(contact.data().role ?? ""),
      email: String(contact.data().email ?? ""),
      online: Boolean(online),
      lastSeenAt: lastSeen?.toISOString() ?? null,
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
        deletedForEveryone: Boolean(last.deletedForEveryone),
      } : null,
    };
  }));

  conversations.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  const contactUid = request.nextUrl.searchParams.get("contactUid");
  let thread: Array<{ messageId: string; senderUid: string; body: string; sentAt: string | null; deliveredAt: string | null; seenAt: string | null; reactions: Record<string, string[]>; deletedFor: string[]; deletedForEveryone: boolean }> = [];
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
        deliveredAt: message.data().deliveredAt?.toDate?.().toISOString() ?? null,
        seenAt: message.data().seenAt?.toDate?.().toISOString() ?? null,
        reactions: message.data().reactions ?? {},
        deletedFor: message.data().deletedFor ?? [],
        deletedForEveryone: Boolean(message.data().deletedForEveryone),
      })).filter((message) => !message.deletedFor.includes(principal.uid));
      if (!request.headers.get("x-message-preview")) {
        await Promise.all(messages.docs
          .filter((message) => message.data().senderUid !== principal.uid && !message.data().seenAt)
          .map((message) => message.ref.update({ seenAt: FieldValue.serverTimestamp(), deliveredAt: message.data().deliveredAt ?? FieldValue.serverTimestamp() })));
      }
    }
  }
  return NextResponse.json({ contacts, conversations, thread, currentUid: principal.uid });
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
  const recipientPresence = await db.collection("presence").doc(input.data.contactUid).get();
  const recipientOnline = recipientPresence.data()?.online === true && Date.now() - (recipientPresence.data()?.lastSeenAt?.toMillis?.() ?? 0) < 90_000;
  const messageRef = conversationRef.collection("messages").doc();
  await messageRef.set({
    senderUid: principal.uid,
    body: input.data.body,
    sentAt: FieldValue.serverTimestamp(),
    deliveredAt: recipientOnline ? FieldValue.serverTimestamp() : null,
    seenAt: null,
    reactions: {},
    deletedFor: [],
    deletedForEveryone: false,
  });
  await db.collection("notifications").doc().set({
    tenantId: principal.tenantId,
    recipientUid: input.data.contactUid,
    senderUid: principal.uid,
    conversationId,
    type: "new_message",
    title: "New Careflow message",
    body: String(currentSnapshot.data()?.displayName ?? "A staff member") + ": " + input.data.body.slice(0, 120),
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true, conversationId }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const input = z.object({
    contactUid: z.string().min(1).max(128),
    messageId: z.string().min(1).max(128),
    action: z.enum(["mark-delivered", "mark-seen", "react"]),
    emoji: z.string().trim().max(8).optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid message action." }, { status: 400 });

  const participantUids = [principal.uid, input.data.contactUid].sort();
  const conversationId = `${participantUids[0]}_${participantUids[1]}`;
  const { db } = getFirebaseAdmin();
  const messageRef = db.collection("conversations").doc(conversationId).collection("messages").doc(input.data.messageId);
  const conversation = await db.collection("conversations").doc(conversationId).get();
  if (!conversation.exists || !conversation.data()?.participantUids.includes(principal.uid)) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  const message = await messageRef.get();
  if (!message.exists) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  const ref = message.ref;

  if (input.data.action === "mark-delivered" || input.data.action === "mark-seen") {
    if (message.data()?.senderUid === principal.uid) return NextResponse.json({ error: "Sender cannot update receipt." }, { status: 403 });
    await ref.update({
      deliveredAt: message.data()?.deliveredAt ?? FieldValue.serverTimestamp(),
      ...(input.data.action === "mark-seen" ? { seenAt: FieldValue.serverTimestamp() } : {}),
    });
  } else {
    if (!input.data.emoji) return NextResponse.json({ error: "Choose a reaction." }, { status: 400 });
    if (message.data()?.deletedForEveryone) return NextResponse.json({ error: "Deleted messages cannot be reacted to." }, { status: 400 });
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      const reactions = { ...(current.data()?.reactions ?? {}) } as Record<string, string[]>;
      for (const [emoji, uids] of Object.entries(reactions)) {
        reactions[emoji] = uids.filter((uid) => uid !== principal.uid);
      }
      const previousReaction = Object.keys(reactions).find((emoji) =>
        (current.data()?.reactions?.[emoji] ?? []).includes(principal.uid));
      if (previousReaction !== input.data.emoji) {
        reactions[input.data.emoji!] = Array.from(new Set([
          ...(reactions[input.data.emoji!] ?? []),
          principal.uid,
        ]));
      }
      transaction.update(ref, { reactions });
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const input = z.object({
    contactUid: z.string().min(1).max(128),
    messageId: z.string().min(1).max(128),
    scope: z.enum(["me", "everyone"]),
  }).safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid delete request." }, { status: 400 });

  const { db } = getFirebaseAdmin();
  const participantUids = [principal.uid, input.data.contactUid].sort();
  const conversationId = `${participantUids[0]}_${participantUids[1]}`;
  const conversation = await db.collection("conversations").doc(conversationId).get();
  if (!conversation.exists || !conversation.data()?.participantUids.includes(principal.uid)) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  const messageRef = db.collection("conversations").doc(conversationId).collection("messages").doc(input.data.messageId);
  const message = await messageRef.get();
  if (!message.exists) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  if (input.data.scope === "everyone" && message.data()?.senderUid !== principal.uid) {
    return NextResponse.json({ error: "You can delete your own message for everyone." }, { status: 403 });
  }
  if (input.data.scope === "everyone") {
    await messageRef.update({
      deletedForEveryone: true,
      deletedFor: [],
      body: "",
      reactions: {},
    });
  } else {
    const deletedFor = Array.from(new Set([...(message.data()?.deletedFor ?? []), principal.uid]));
    await messageRef.update({ deletedFor });
  }
  return NextResponse.json({ ok: true });
}
