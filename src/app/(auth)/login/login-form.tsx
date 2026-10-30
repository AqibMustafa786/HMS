"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, reload, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"signin" | "create" | "verify">("signin");
  const [notice, setNotice] = useState("");

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
        router.replace("/dashboard");
        router.refresh();
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
      router.replace("/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to complete verification.");
    } finally {
      setPending(false);
    }
  }, [createSession, router]);

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
        router.replace("/dashboard");
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to complete sign-in.");
      }
    });
  }, [createSession, router]);

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
      router.replace("/dashboard");
      router.refresh();
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
      setMode("verify");
      setNotice("Account created. Check your email and verify the link before signing in.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create account.");
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
          <label>Email address<input type="email" name="email" autoComplete="username" required /></label>
          <label>Password<input type="password" name="password" minLength={6} autoComplete={mode === "create" ? "new-password" : "current-password"} required /></label>
          <div className="auth-options"><span>Verified hospital account</span><button className="link-btn" type="button">Forgot password?</button></div>
          {error && <p className="auth-demo-note" role="alert">{error}</p>}
          <button className="btn btn-primary auth-submit" type="submit" disabled={pending}>{pending ? "Working..." : mode === "create" ? "Create verified account" : "Sign in"}</button>
          <button className="link-btn" type="button" onClick={() => { setMode(mode === "create" ? "signin" : "create"); setError(""); }}>{mode === "create" ? "I already have an account" : "Create an account"}</button>
        </form>
      )}
    </>
  );
}
