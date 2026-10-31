export default function LaboratoryResultsPage() {
  return (
    <main>
      <div className="page-heading"><div><p className="eyebrow">Clinical workspace</p><h1>Laboratory results</h1><p className="subtle">Pending tests, completed results, and patient references.</p></div></div>
      <section className="panel workspace-empty-state"><strong>No laboratory results available</strong><small>Laboratory requests and results will appear when the integration is configured.</small></section>
    </main>
  );
}
