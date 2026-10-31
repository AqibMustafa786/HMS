export default function PrescriptionsPage() {
  return (
    <main>
      <div className="page-heading"><div><p className="eyebrow">Clinical workspace</p><h1>Prescriptions</h1><p className="subtle">Medication orders, dosage instructions, and prescription status.</p></div></div>
      <section className="panel workspace-empty-state"><strong>No prescriptions available</strong><small>Prescription records are managed through the clinical prescribing workflow.</small></section>
    </main>
  );
}
