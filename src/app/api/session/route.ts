import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/authorization/roles";

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
      const account = await auth.getUser(claims.uid);
      const assignment = {
        tenantId: process.env.FIREBASE_PROJECT_ID ?? "hms-careflow",
        branchIds: ["main"],
        permissions: [...DEFAULT_ROLE_PERMISSIONS.superadmin],
        status: "active",
        email: superadminEmail,
        displayName: account.displayName || "Aqib Mustafa",
        role: "superadmin",
        updatedAt: new Date(),
      };
      await db.collection("users").doc(claims.uid).set(assignment, { merge: true });
    } else {
      const userRef = db.collection("users").doc(claims.uid);
      const user = await userRef.get();
      if (!user.exists) {
        await userRef.set({
          uid: claims.uid,
          email: String(claims.email ?? "").toLowerCase(),
          tenantId: process.env.FIREBASE_PROJECT_ID ?? "hms-careflow",
          branchIds: ["main"],
          permissions: [...DEFAULT_ROLE_PERMISSIONS.patient],
          role: "patient",
          status: "active",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const registration = await userRef.get();
      if (registration.data()?.role === "pending_doctor" || registration.data()?.status === "pending") {
        return NextResponse.json({ error: "Doctor registration is awaiting administrator approval." }, { status: 403 });
      }
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/FIREBASE_SERVICE_ACCOUNT_JSON|project_id|credentials/i.test(message)) {
      console.error("Server authentication configuration error:", message);
      return NextResponse.json({ error: "Server authentication is not configured correctly.", code: "SERVER_AUTH_CONFIG" }, { status: 503 });
    }
    console.error("Session creation failed:", error);
    return NextResponse.json({ error: "Unable to create the secure session. Check the account and try again.", code: "SESSION_CREATE_FAILED" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("__session", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
