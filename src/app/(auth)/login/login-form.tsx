"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, reload, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"signin" | "create" | "verify">("signin");
  const [notice, setNotice] = useState("");
  const [registrationRole, setRegistrationRole] = useState<"patient" | "doctor">("patient");
  const redirected = useRef(false);

  const enterDashboard = useCallback(() => {
    if (redirected.current) return;
    redirected.current = true;
    window.setTimeout(() => {
      // A full navigation ensures Next's router never receives actions during Firebase initialization.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/dashboard";
    }, 0);
  }, []);

  const createSession = useCallback(async () => {
    const { auth } = getFirebaseClient();
    await reload(auth.currentUser!);
    if (!auth.currentUser?.emailVerified) return false;
    const idToken = await auth.currentUser.getIdToken(true);
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      credentials: "same-origin",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? "Unable to create a secure hospital session.");
    }
    return true;
  }, []);

  async function resendVerification() {
    const { auth } = getFirebaseClient();
    if (!auth.currentUser) {
      setError("Sign in first, then resend verification.");
      setMode("signin");
      return;
    }
    setPending(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        await createSession();
        enterDashboard();
        return;
      }
      await sendEmailVerification(auth.currentUser);
      setNotice("A fresh verification email was sent. Verify it, then return here.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to resend verification email.");
    } finally {
      setPending(false);
    }
  }

  const checkVerification = useCallback(async () => {
    const { auth } = getFirebaseClient();
    if (!auth.currentUser) return;
    setPending(true);
    try {
      await reload(auth.currentUser);
      if (!auth.currentUser.emailVerified) {
        setNotice("Email is not verified yet. Open the newest verification link and try again.");
        return;
      }
      await createSession();
      enterDashboard();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to complete verification.");
    } finally {
      setPending(false);
    }
  }, [createSession, enterDashboard]);

  useEffect(() => {
    const { auth } = getFirebaseClient();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        return;
      }
      await reload(user);
      if (!user.emailVerified) {
        setMode("verify");
        setNotice("Verification is pending. Reload this page after verifying your email.");
        return;
      }
      try {
        await createSession();
        enterDashboard();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to complete sign-in.");
      }
    });
  }, [createSession, enterDashboard]);

  useEffect(() => {
    if (mode !== "verify") return;
    const interval = window.setInterval(checkVerification, 5000);
    return () => window.clearInterval(interval);
  }, [checkVerification, mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const { auth } = getFirebaseClient();
      const credential = await signInWithEmailAndPassword(auth, String(form.get("email")), String(form.get("password")));
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        setMode("verify");
        setNotice("Verification email sent. Verify the link, then sign in again.");
        return;
      }
      await createSession();
      enterDashboard();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to sign in.";
      setError(message.includes("auth/")
        ? message.replace("Firebase: Error (", "").replace(").", "").replace("auth/", "").replaceAll("-", " ")
        : message);
    } finally {
      setPending(false);
    }
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const { auth } = getFirebaseClient();
      const credential = await createUserWithEmailAndPassword(auth, String(form.get("email")), String(form.get("password")));
      await sendEmailVerification(credential.user);
      const idToken = await credential.user.getIdToken();
      const registrationResponse = await fetch("/api/account-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          role: registrationRole,
          fullName: String(form.get("fullName") ?? "").trim(),
          registrationNumber: registrationRole === "doctor" ? String(form.get("registrationNumber") ?? "").trim() : undefined,
        }),
      });
      if (!registrationResponse.ok) {
        const registrationError = await registrationResponse.json().catch(() => null) as { error?: string } | null;
        throw new Error(registrationError?.error ?? "Unable to submit account registration.");
      }
      setMode("verify");
      setNotice(registrationRole === "doctor"
        ? "Registration submitted. Verify your email and wait for administrator approval."
        : "Account created. Check your email and verify the link before signing in.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create account.");
    } finally {
      setPending(false);
    }
  }

  async function forgotPassword() {
      const { auth } = getFirebaseClient();
      const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
      const email = emailInput?.value.trim() ?? "";
      if (!email) {
        setError("Enter your email address first.");
        return;
      }
      setPending(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setNotice("Password reset instructions were sent to your email.");
        setError("");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to send password reset email.");
      } finally {
        setPending(false);
    }
  }

  return (
    <>
      {mode === "verify" ? (
        <div className="auth-form">
          <p className="auth-demo-note" role="status">{notice}</p>
          {error && <p className="auth-demo-note" role="alert">{error}</p>}
          <button className="btn btn-primary auth-submit" type="button" disabled={pending} onClick={checkVerification}>{pending ? "Checking..." : "I've verified my email"}</button>
          <button className="link-btn" type="button" disabled={pending} onClick={resendVerification}>Resend verification email</button>
          <button className="btn btn-primary auth-submit" type="button" onClick={() => { setMode("signin"); setNotice(""); }}>Return to sign in</button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={mode === "create" ? createAccount : handleSubmit}>
          {mode === "create" && <label>Full name<input type="text" name="fullName" autoComplete="name" required /></label>}
          {mode === "create" && <div className="registration-role"><button type="button" className={registrationRole === "patient" ? "active" : ""} onClick={() => setRegistrationRole("patient")}>Patient</button><button type="button" className={registrationRole === "doctor" ? "active" : ""} onClick={() => setRegistrationRole("doctor")}>Doctor</button></div>}
          {mode === "create" && registrationRole === "doctor" && <label>Medical registration number<input name="registrationNumber" required /></label>}
          <label>Email address<input type="email" name="email" autoComplete="username" required /></label>
          <label>Password<input type="password" name="password" minLength={6} autoComplete={mode === "create" ? "new-password" : "current-password"} required /></label>
          <div className="auth-options"><span>Verified hospital account</span>{mode === "signin" && <button className="link-btn" type="button" onClick={forgotPassword}>Forgot password?</button>}</div>
          {notice && mode === "signin" && <p className="auth-demo-note" role="status">{notice}</p>}
          {error && <p className="auth-demo-note" role="alert">{error}</p>}
          <button className="btn btn-primary auth-submit" type="submit" disabled={pending}>{pending ? "Working..." : mode === "create" ? "Create verified account" : "Sign in"}</button>
          <button className="link-btn" type="button" onClick={() => { setMode(mode === "create" ? "signin" : "create"); setError(""); }}>{mode === "create" ? "I already have an account" : "Create an account"}</button>
        </form>
      )}
    </>
  );
}
