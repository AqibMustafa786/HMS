"use client";

import { CalendarDays, Mail, Search, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function DoctorsPage() {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [applications, setApplications] = useState<Array<{ uid: string; displayName?: string; email?: string; registrationNumber?: string | null }>>([]);
  const [doctors, setDoctors] = useState<Array<{ uid: string; displayName?: string; email?: string; registrationNumber?: string | null; departmentId?: string; title?: string; status?: string }>>([]);
  const [profileRole, setProfileRole] = useState("");
  const [reviewing, setReviewing] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/profile"), fetch("/api/roles")]).then(async ([profileResponse, rolesResponse]) => {
      const profileData = await profileResponse.json().catch(() => null) as { profile?: { role?: string } } | null;
      setProfileRole(profileData?.profile?.role ?? "");
      if (rolesResponse.ok) {
        const roleData = await rolesResponse.json().catch(() => null) as {
          applications?: typeof applications;
          doctors?: typeof doctors;
        } | null;
        setApplications(roleData?.applications ?? []);
        setDoctors(roleData?.doctors ?? []);
      }
    }).catch(() => undefined);
  }, []);

  async function reviewApplication(uid: string, action: "approve" | "reject") {
    setReviewing(uid);
    const response = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, uid, role: "doctor" }),
    });
    if (response.ok) setApplications((current) => current.filter((application) => application.uid !== uid));
    setReviewing("");
  }

  const filteredDoctors = doctors.filter((doctor) => `${doctor.displayName ?? ""} ${doctor.title ?? ""} ${doctor.departmentId ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Medical team</p><h1>Doctors</h1><p className="subtle">Availability, schedules, and consultation profiles.</p></div><input ref={uploadRef} hidden type="file" multiple accept=".pdf,image/*" /><button className="btn btn-primary" onClick={() => uploadRef.current?.click()}><Upload size={15} /> Upload profile document</button></div>
      {(profileRole === "superadmin" || profileRole === "admin") && applications.length > 0 && (
        <section className="panel doctor-applications">
          <div className="panel-head"><div><h2>Doctor applications</h2><p>Review verified registration requests before granting access.</p></div><span className="settings-role">{applications.length} pending</span></div>
          <div className="application-list">
            {applications.map((application) => (
              <div className="application-row" key={application.uid}>
                <span className="avatar avatar-doctor">{application.displayName?.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "DR"}</span>
                <div><strong>{application.displayName || "Doctor applicant"}</strong><small>{application.email}</small>{application.registrationNumber && <small>Registration: {application.registrationNumber}</small>}</div>
                <div className="application-actions">
                  <button className="btn btn-secondary btn-small" disabled={reviewing === application.uid} onClick={() => reviewApplication(application.uid, "reject")} type="button">Reject</button>
                  <button className="btn btn-primary btn-small" disabled={reviewing === application.uid} onClick={() => reviewApplication(application.uid, "approve")} type="button">Approve doctor</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="table-toolbar"><div className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search doctor or specialty" /></div><select aria-label="Department"><option>All departments</option><option>Cardiology</option><option>Neurology</option></select><select aria-label="Availability"><option>Any availability</option><option>Available today</option></select></div>
      {filteredDoctors.length === 0
        ? <div className="panel empty-state"><strong>{query ? "No matching doctors" : "No doctors registered"}</strong><small>{query ? "Try a different name, specialty, or department." : "Approved doctor accounts will appear here."}</small></div>
        : <div className="doctor-grid">{filteredDoctors.map((doctor) => {
          const name = doctor.displayName || "Doctor account";
          const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
          return (
            <article className="panel doctor-card live-doctor-card" key={doctor.uid}>
              <div className="doctor-card-top">
                <span className="avatar doctor-avatar">{initials}<i className="status-dot" /></span>
                <span className="availability">{doctor.status === "active" ? "Active" : doctor.status || "Active"}</span>
              </div>
              <h2><Link href={`/dashboard/doctors/${doctor.uid}`}>{name}</Link></h2>
              <p>{doctor.title || "Medical practitioner"}</p>
              <div className="doctor-details">
                <span><ShieldCheck size={14} /><small>Registration<strong>{doctor.registrationNumber || "Not provided"}</strong></small></span>
                <span><Mail size={14} /><small>Account<strong>{doctor.email || "Not available"}</strong></small></span>
              </div>
              <div className="doctor-card-footer">
                <span className="doctor-department"><CalendarDays size={13} />{doctor.departmentId || "Department not set"}</span>
                <Link href={`/dashboard/doctors/${doctor.uid}`} className="btn btn-secondary btn-small">View profile</Link>
              </div>
            </article>
          );
        })}</div>}
    </>
  );
}
