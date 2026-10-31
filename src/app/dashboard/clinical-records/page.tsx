export default function ClinicalRecordsPage() {
  return (
    <main>
      <div className="page-heading"><div><p className="eyebrow">Clinical workspace</p><h1>Clinical records</h1><p className="subtle">Authorized diagnoses, notes, observations, and treatment history.</p></div></div>
      <section className="panel workspace-empty-state"><strong>No clinical record module configured</strong><small>Records will appear here after the clinical data integration is enabled.</small></section>
    </main>
  );
}
