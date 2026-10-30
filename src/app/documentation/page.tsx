export default function DocumentationPage() {
  return (
    <main className="documentation-page">
      <p className="eyebrow">Careflow HMS</p>
      <h1>Application documentation</h1>
      <section id="clinical-workflows"><h2>Clinical workflows</h2><p>Register patients, assign authorized clinicians, create appointments, maintain clinical records, and upload documents through tenant-scoped workflows.</p></section>
      <section id="security"><h2>Security and access</h2><p>Authentication, server-side authorization, Firestore rules, tenant isolation, audit events, and secret handling are enforced on trusted server operations.</p></section>
      <section><h2>Deployment</h2><p>Configure Firebase client variables and Admin credentials through environment variables. Never place service-account private keys in client code or source control.</p></section>
    </main>
  );
}
