import "server-only";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import type { TrustedPrincipal } from "@/lib/authorization/policy";
import { normalizeRole } from "@/lib/authorization/roles";

const assignmentSchema = z.object({
  tenantId: z.string().min(1),
  branchIds: z.array(z.string().min(1)),
  permissions: z.array(z.string().min(1)),
  status: z.enum(["active", "disabled"]),
  role: z.string().min(1),
});

/**
 * Verifies a Firebase session cookie and loads authorization assignments from
 * a server-controlled user record. Call only in server code; do not accept a
 * principal, tenant, branch, or permission from request body/query parameters.
 */
export async function resolveTrustedPrincipal(sessionCookie: string): Promise<TrustedPrincipal | null> {
  if (!sessionCookie) return null;

  try {
    const { auth, db } = getFirebaseAdmin();
    const { uid } = await auth.verifySessionCookie(sessionCookie, true);
    const snapshot = await db.collection("users").doc(uid).get();
    if (!snapshot.exists) return null;

    const assignment = assignmentSchema.safeParse(snapshot.data());
    if (!assignment.success) return null;
    const role = normalizeRole(assignment.data.role);
    if (!role) return null;

    return { uid, ...assignment.data, role };
  } catch {
    return null;
  }
}
