import { CalendarDays, ShieldCheck } from "lucide-react";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export default async function DoctorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection("users").doc(id).get();
  const doctor = snapshot.exists && snapshot.data()?.role === "doctor" ? snapshot.data()! : null;
  if (!doctor) {
    return <section className="panel empty-state"><h1>Doctor not found</h1><p>This profile does not exist or has not been published.</p></section>;
  }
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Doctor profile</p><h1>{doctor.displayName || "Doctor account"}</h1><p className="subtle">{doctor.title || "Medical practitioner"}</p></div><a href="/dashboard/appointments" className="btn btn-primary"><CalendarDays size={15} /> Book appointment</a></div>
      <div className="profile-grid">
        <main className="profile-main">
          <section className="panel doctor-intro">
            <span className="avatar doctor-avatar">{String(doctor.displayName || "DR").split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}<i className="status-dot" /></span>
            <div><span className="availability">Active account</span><h2>{doctor.title || "Medical practitioner"}</h2><p>{doctor.email}</p></div>
          </section>
          <section className="panel detail-section">
            <div className="panel-head"><div><h2>Professional credentials</h2><p>Registration information supplied by the doctor</p></div></div>
            <div className="profile-facts">
              <span><small>Registration number</small><strong>{doctor.registrationNumber || "Not provided"}</strong></span>
              <span><small>Department</small><strong>{doctor.departmentId || "Not set"}</strong></span>
              <span><small>Account status</small><strong>{doctor.status || "Active"}</strong></span>
            </div>
          </section>
        </main>
        <aside className="profile-side">
          <section className="panel side-card">
            <h2>Account verification</h2>
            <p className="verified-note"><ShieldCheck size={16} /> Approved medical staff account</p>
          </section>
        </aside>
      </div>
    </>
  );
}
