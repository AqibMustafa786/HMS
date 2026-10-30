"use client";

import { CalendarDays, Clock3, Search, Star, Upload } from "lucide-react";
import Link from "next/link";
import { doctors } from "@/components/data";
import { useEffect, useRef, useState } from "react";

export default function DoctorsPage() {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [applications, setApplications] = useState<Array<{ uid: string; displayName?: string; email?: string; registrationNumber?: string | null }>>([]);
  const [profileRole, setProfileRole] = useState("");
  const [reviewing, setReviewing] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/profile"), fetch("/api/roles")]).then(async ([profileResponse, rolesResponse]) => {
      const profileData = await profileResponse.json().catch(() => null) as { profile?: { role?: string } } | null;
      setProfileRole(profileData?.profile?.role ?? "");
      if (rolesResponse.ok) {
        const roleData = await rolesResponse.json().catch(() => null) as { applications?: typeof applications } | null;
        setApplications(roleData?.applications ?? []);
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

  const filteredDoctors = doctors.filter((doctor) => `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(query.toLowerCase()));
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
        ? <div className="panel empty-state"><strong>No doctors registered</strong><small>Doctor profiles and schedules will appear here after staff accounts are created.</small></div>
        : <div className="doctor-grid">{filteredDoctors.map((doctor) => <article className="panel doctor-card" key={doctor.id}><div className="doctor-card-top"><span className={`avatar doctor-avatar ${doctor.color}`}>{doctor.initials}<i className="status-dot" /></span><span className={`availability ${doctor.status === "Available" ? "" : "busy"}`}>{doctor.status}</span></div><h2><Link href={`/dashboard/doctors/${doctor.id}`}>{doctor.name}</Link></h2><p>{doctor.specialty}</p><div className="doctor-meta"><span><Star size={13} /> {doctor.rating}</span><span>{doctor.patients} patients today</span></div><div className="doctor-details"><span><Clock3 size={14} /><small>Shift<strong>{doctor.shift}</strong></small></span><span><CalendarDays size={14} /><small>Seats today<strong>{doctor.seats} available</strong></small></span></div><div className="doctor-card-footer"><strong>PKR {doctor.fee}<small> / visit</small></strong><Link href={`/dashboard/doctors/${doctor.id}`} className="btn btn-secondary btn-small">View profile</Link></div></article>)}</div>}
    </>
  );
}
