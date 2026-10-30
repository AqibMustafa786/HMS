import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in | Careflow HMS" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card panel" aria-labelledby="login-title">
        <Link href="/dashboard" className="brand auth-brand"><span className="brand-mark"><span /></span><span>Careflow</span></Link>
        <div className="auth-heading"><p className="eyebrow">Authorized staff access</p><h1 id="login-title">Sign in to your workspace</h1><p>Use your hospital account to continue.</p></div>
        <LoginForm />
        <p className="auth-demo-note">Authentication integration is ready for Firebase configuration. Do not use this page with real credentials until the verified session provider is enabled.</p>
        <footer className="auth-footer">Protected hospital system · Authorized use only</footer>
      </section>
    </main>
  );
}
