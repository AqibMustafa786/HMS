import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

const createSchema = z.object({ idToken: z.string().min(1).max(4096) });
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const { auth } = getFirebaseAdmin();
    const claims = await auth.verifyIdToken(parsed.data.idToken, true);
    if (!claims.email_verified) {
      return NextResponse.json({ error: "Verify your email address before signing in." }, { status: 403 });
    }
    const { db } = getFirebaseAdmin();
    const superadminEmail = (process.env.SUPERADMIN_EMAIL ?? "aqib2k1@gmail.com").toLowerCase();
    if (String(claims.email ?? "").toLowerCase() === superadminEmail) {
      const assignment = {
        tenantId: process.env.FIREBASE_PROJECT_ID ?? "hms-careflow",
        branchIds: ["main"],
        permissions: ["*"],
        status: "active",
        email: superadminEmail,
        role: "superadmin",
        updatedAt: new Date(),
      };
      await db.collection("users").doc(claims.uid).set(assignment, { merge: true });
      await db.collection("superadmins").doc(claims.uid).set({
        uid: claims.uid,
        email: superadminEmail,
        tenantId: assignment.tenantId,
        status: "active",
        updatedAt: new Date(),
      }, { merge: true });
    }
    const cookie = await auth.createSessionCookie(parsed.data.idToken, { expiresIn: 12 * 60 * 60 * 1000 });
    const principal = await resolveTrustedPrincipal(cookie);
    if (!principal || claims.uid !== principal.uid) return NextResponse.json({ error: "Account access is not authorized." }, { status: 403 });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("__session", cookie, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      maxAge: 12 * 60 * 60, path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to sign in. Check your account and try again." }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("__session", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
