import { CalendarDays, ChevronRight, FileText, Mail, MessageCircle, Paperclip, Phone } from "lucide-react";
import { patients } from "@/components/data";
import { ProfilePhoto } from "@/components/profile-photo";

export default async function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = patients.find((item) => item.id === id);
  if (!patient) {
    return <section className="panel empty-state"><h1>Patient not found</h1><p>This patient does not exist or you do not have access to it.</p></section>;
  }
  return (
    <>
      <div className="breadcrumbs">Patients <ChevronRight size={13} /> {patient.name}</div>
      <section className="profile-header"><ProfilePhoto patientId={patient.id} initials={patient.initials} /><div><span className="profile-status"><i />{patient.status}</span><h1>{patient.name}</h1><p>{patient.id} · {patient.age} years · {patient.sex}</p></div><div className="profile-actions"><a className="icon-btn" href={`tel:${patient.phone}`} aria-label="Call patient"><Phone size={16} /></a><a className="icon-btn" href="mailto:fictional.patient@example.com" aria-label="Email patient"><Mail size={16} /></a><a href="/dashboard/messages" className="btn btn-primary"><MessageCircle size={15} /> Message</a></div></section>
      <div className="profile-grid">
        <main className="profile-main">
          <section className="panel detail-section"><div className="panel-head"><div><h2>Patient summary</h2><p>Last reviewed Oct 30, 2026 by Dr. Ayesha Malik</p></div><button className="link-btn">Edit record</button></div><div className="clinical-grid"><div><small>Blood group</small><strong>B+</strong></div><div><small>Primary condition</small><strong>Hypertension</strong></div><div><small>Allergies</small><strong>Penicillin</strong></div><div><small>Last visit</small><strong>{patient.lastVisit}</strong></div></div></section>
          <section className="panel detail-section"><div className="panel-head"><div><h2>Recent activity</h2><p>Complete patient timeline</p></div><button className="link-btn">View history</button></div><div className="patient-timeline"><div><span /><time>Today, 10:30</time><p><strong>Consultation completed</strong><small>ECG reviewed and prescription updated by Dr. Ayesha Malik.</small></p></div><div><span /><time>Oct 24, 2026</time><p><strong>Lab report uploaded</strong><small>Complete blood count · Added by Sara Khan.</small></p></div><div><span /><time>Oct 18, 2026</time><p><strong>Follow-up appointment</strong><small>Blood pressure reviewed with Dr. Ayesha Malik.</small></p></div></div></section>
          <section className="panel detail-section"><div className="panel-head"><div><h2>Documents</h2><p>Reports and attachments</p></div><a href="/dashboard/documents" className="btn btn-small"><Paperclip size={14} /> Open library</a></div><div className="document-row"><span className="file-icon"><FileText size={17} /></span><span><strong>No documents</strong><small>Uploaded reports will appear here.</small></span></div></section>
        </main>
        <aside className="profile-side"><section className="panel side-card"><h2>Contact</h2><p><Phone size={14} />{patient.phone}</p><p><Mail size={14} />fictional.patient@example.com</p></section><section className="panel side-card"><div className="panel-head"><h2>Assigned doctor</h2></div><div className="patient-mini"><span className="avatar teal">AM</span><span><strong>{patient.doctor}</strong><small>Cardiology</small></span></div><a href="/dashboard/appointments" className="btn btn-secondary full-btn"><CalendarDays size={14} /> Book appointment</a></section><section className="panel side-card"><h2>Care plan</h2><div className="care-item"><span /><p><strong>No active tasks</strong><small>Care tasks can be added by the assigned clinician.</small></p></div></section></aside>
      </div>
    </>
  );
}
