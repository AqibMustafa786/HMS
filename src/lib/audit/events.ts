import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import type { TrustedPrincipal } from "@/lib/authorization/policy";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

const auditInputSchema = z.object({
  action: z.string().min(1).max(100),
  resourceType: z.string().min(1).max(100),
  resourceId: z.string().min(1).max(200),
  outcome: z.enum(["success", "denied", "failure"]),
  reasonCode: z.string().max(100).optional(),
});

export type AuditEventInput = z.infer<typeof auditInputSchema>;

/** Writes a minimal server-timestamped audit event; do not add patient details or secrets. */
export async function appendAuditEvent(principal: TrustedPrincipal, input: AuditEventInput): Promise<void> {
  if (principal.status !== "active") throw new Error("An active trusted principal is required to append an audit event.");
  const event = auditInputSchema.parse(input);
  const { db } = getFirebaseAdmin();
  await db.collection("auditEvents").add({
    ...event,
    tenantId: principal.tenantId,
    actorUid: principal.uid,
    occurredAt: FieldValue.serverTimestamp(),
  });
}
