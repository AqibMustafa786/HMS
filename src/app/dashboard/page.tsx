"use client";

import { CalendarDays, ChevronRight, ClipboardCheck, FlaskConical, Users } from "lucide-react";
import Link from "next/link";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";

type Appointment = { appointmentId: string; patientId: string; startsAt: string | null; reason: string; state: string };
type Patient = { id: string; givenName: string; familyName: string; lifecycleState: string };

export default function DashboardPage() {
  const [role, setRole] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Array<{ uid: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number | null>(null);
  const [profileError, setProfileError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setProfileError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    Promise.all([
      fetch("/api/profile", { cache: "no-store", signal: controller.signal }),
      fetch("/api/appointments", { cache: "no-store", signal: controller.signal }),
      fetch("/api/patients", { cache: "no-store", signal: controller.signal }),
      fetch("/api/roles", { cache: "no-store", signal: controller.signal }),
    ])
      .then(async ([profileResponse, appointmentsResponse, patientsResponse, rolesResponse]) => {
        const profileData = await profileResponse.json().catch(() => null) as { profile?: { role?: string } } | null;
        const appointmentData = await appointmentsResponse.json().catch(() => null) as { appointments?: Appointment[] } | null;
        const patientData = await patientsResponse.json().catch(() => null) as { patients?: Patient[] } | null;
        const rolesData = await rolesResponse.json().catch(() => null) as { doctors?: Array<{ uid: string }> } | null;
        if (!profileResponse.ok || !profileData?.profile?.role) throw new Error("Profile unavailable");
        setRole(profileData?.profile?.role ?? "");
        setAppointments(appointmentData?.appointments ?? []);
        setPatients(patientData?.patients ?? []);
        setDoctors(rolesData?.doctors ?? []);
      })
      .catch(() => setProfileError("Your workspace profile could not be loaded."))
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
        setNow(Date.now());
      });
  }, []);

  useEffect(() => {
    const start = window.setTimeout(() => { void loadWorkspace(); }, 0);
    return () => window.clearTimeout(start);
  }, [loadWorkspace]);

  const isDoctor = role === "doctor";
  const isPatient = role === "patient";
  const isAdmin = role === "superadmin" || role === "hospital_admin";
  const today = new Date().toDateString();
  const todaysAppointments = useMemo(() => appointments.filter((appointment) =>
    appointment.startsAt && new Date(appointment.startsAt).toDateString() === today
  ).sort((a, b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime()), [appointments, today]);
  const upcomingAppointments = useMemo(() => appointments.filter((appointment) =>
    appointment.startsAt && now !== null && new Date(appointment.startsAt).getTime() > now
  ).sort((a, b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime()).slice(0, 4), [appointments, now]);
  const completedAppointments = appointments.filter((appointment) => appointment.state === "completed").length;

  return (
    <>
      <div className="page-heading clinical-page-heading">
        <div>
          <p className="eyebrow">{isDoctor ? "Doctor workspace" : isPatient ? "Patient portal" : "Clinic overview"}</p>
          <h1>{isDoctor ? "Clinical overview" : isPatient ? "My care overview" : "Good morning"}</h1>
          <p className="subtle">{isDoctor ? "A concise summary of your clinical activity and patient care." : isPatient ? "View your appointments, doctors, documents, and care conversations." : "Here is what is happening in your clinic today."}</p>
        </div>
        <div className="heading-actions">
          <Link className="btn btn-secondary" href="/dashboard/appointments">{isPatient ? "My appointments" : "View schedule"}</Link>
          {!isPatient && <AppointmentDialog />}
        </div>
      </div>

      {isAdmin ? (
        <>
          <section className="hospital-kpis" aria-label="Hospital overview">
            <div><small>Total patients</small><strong>{loading ? "—" : patients.length}</strong><span>Accessible records</span></div>
            <div><small>Today&apos;s appointments</small><strong>{loading ? "—" : todaysAppointments.length}</strong><span>Scheduled today</span></div>
            <div><small>Active doctors</small><strong>{loading ? "—" : doctors.length}</strong><span>Approved directory</span></div>
            <div><small>Available beds</small><strong>—</strong><span>Module not connected</span></div>
            <div><small>Today&apos;s revenue</small><strong>—</strong><span>Billing data not connected</span></div>
            <div><small>Pending payments</small><strong>—</strong><span>Billing data not connected</span></div>
          </section>
          <section className="hospital-command-grid">
            <article className="panel operations-panel">
              <div className="panel-head"><div><h2>Appointment activity</h2><p>Today&apos;s clinic schedule</p></div><Link href="/dashboard/appointments" className="link-btn">Open appointments <ChevronRight size={14} /></Link></div>
              {loading ? <div className="clinical-loading">Loading activity…</div> : todaysAppointments.length === 0 ? <div className="schedule-empty-state"><CalendarDays size={20} /><strong>No appointments today</strong><small>New appointments will appear here.</small></div> : <div className="hospital-activity-list">{todaysAppointments.slice(0, 6).map((appointment) => <div key={appointment.appointmentId}><time>{appointment.startsAt ? new Date(appointment.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</time><span><strong>{appointment.patientId}</strong><small>{appointment.reason}</small></span><b className={`workflow-status status-${appointment.state}`}>{appointment.state.replaceAll("-", " ")}</b></div>)}</div>}
            </article>
            <aside className="panel hospital-alerts">
              <div className="panel-head"><div><h2>Operational attention</h2><p>Current exceptions</p></div></div>
              <div className="attention-list">
                <Link href="/dashboard/appointments"><span className="attention-dot amber-dot" /><span><strong>Appointments</strong><small>{appointments.filter((appointment) => appointment.state === "booked").length} booked visits require review</small></span><ChevronRight size={14} /></Link>
                <Link href="/dashboard/doctors"><span className="attention-dot blue-dot" /><span><strong>Staff directory</strong><small>{doctors.length} approved doctors in directory</small></span><ChevronRight size={14} /></Link>
                <Link href="/dashboard/patients"><span className="attention-dot green-dot" /><span><strong>Patient registrations</strong><small>{patients.length} records accessible</small></span><ChevronRight size={14} /></Link>
              </div>
            </aside>
            <article className="panel hospital-records-panel">
              <div className="panel-head"><div><h2>Recent patient registrations</h2><p>Latest accessible records</p></div><Link href="/dashboard/patients" className="link-btn">View patients <ChevronRight size={14} /></Link></div>
              {loading ? <div className="clinical-loading">Loading registrations…</div> : patients.length === 0 ? <div className="schedule-empty-state"><Users size={20} /><strong>No patient records</strong><small>Registered patients will appear here.</small></div> : <div className="hospital-patient-table"><div><span>Patient</span><span>Identifier</span><span>Status</span><span>Action</span></div>{patients.slice(0, 7).map((patient) => <Link href={`/dashboard/patients/${patient.id}`} key={patient.id}><span><strong>{`${patient.givenName} ${patient.familyName}`.trim()}</strong></span><span>{patient.id}</span><span><b className="workflow-status">{patient.lifecycleState}</b></span><span>Open profile <ChevronRight size={13} /></span></Link>)}</div>}
            </article>
          </section>
        </>
      ) : isDoctor ? (
        <>
          <section className="clinical-metrics" aria-label="Clinical overview">
            <div><span className="metric-icon teal"><CalendarDays size={18} /></span><div><small>Today&apos;s appointments</small><strong>{loading ? "—" : todaysAppointments.length}</strong><span>{todaysAppointments.length ? "On today&apos;s schedule" : "No appointments today"}</span></div></div>
            <div><span className="metric-icon blue"><Users size={18} /></span><div><small>Assigned patients</small><strong>{loading ? "—" : patients.length}</strong><span>Accessible patient records</span></div></div>
            <div><span className="metric-icon green"><ClipboardCheck size={18} /></span><div><small>Completed consultations</small><strong>{loading ? "—" : completedAppointments}</strong><span>Recorded visits</span></div></div>
            <div><span className="metric-icon amber"><FlaskConical size={18} /></span><div><small>Pending reviews</small><strong>—</strong><span>Review data not configured</span></div></div>
          </section>
          <section className="clinical-workspace">
            <article className="panel schedule-panel">
              <div className="panel-head"><div><h2>Today&apos;s schedule</h2><p>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p></div><Link href="/dashboard/appointments" className="link-btn">Open schedule <ChevronRight size={14} /></Link></div>
              {loading ? <div className="clinical-loading">Loading schedule…</div> : todaysAppointments.length === 0 ? (
                <div className="clinical-empty"><span><CalendarDays size={20} /></span><div><strong>No appointments scheduled today</strong><small>Your confirmed visits will appear in chronological order.</small></div><AppointmentDialog label="New appointment" /></div>
              ) : (
                <div className="appointment-timeline">{todaysAppointments.map((appointment) => (
                  <div className="timeline-row" key={appointment.appointmentId}>
                    <time>{appointment.startsAt ? new Date(appointment.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</time>
                    <span className="timeline-marker" />
                    <div><strong>{appointment.patientId}</strong><small>{appointment.reason}</small></div>
                    <span className={`workflow-status status-${appointment.state}`}>{appointment.state.replaceAll("-", " ")}</span>
                    <Link href={`/dashboard/patients/${appointment.patientId}`} className="btn btn-secondary btn-small">Open patient</Link>
                  </div>
                ))}</div>
              )}
            </article>
            <aside className="panel clinical-side-panel">
              <div className="panel-head"><div><h2>Recent patients</h2><p>Authorized records</p></div><Link href="/dashboard/patients" className="link-btn">View all</Link></div>
              {loading ? <div className="clinical-loading">Loading patients…</div> : patients.length === 0 ? (
                <div className="compact-empty"><Users size={18} /><strong>No assigned patients</strong><small>Authorized patients will appear here.</small></div>
              ) : (
                <div className="recent-patient-list">{patients.slice(0, 5).map((patient) => {
                  const name = `${patient.givenName} ${patient.familyName}`.trim();
                  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
                  return <Link href={`/dashboard/patients/${patient.id}`} className="recent-patient-row" key={patient.id}><span className="avatar avatar-doctor">{initials}</span><span><strong>{name}</strong><small>{patient.id}</small></span><span className="patient-state">{patient.lifecycleState}</span></Link>;
                })}</div>
              )}
            </aside>
            <article className="panel upcoming-panel">
              <div className="panel-head"><div><h2>Upcoming</h2><p>Next appointments</p></div><Link href="/dashboard/appointments" className="link-btn">View schedule</Link></div>
              {upcomingAppointments.length === 0 ? <div className="compact-empty"><CalendarDays size={18} /><strong>No upcoming appointments</strong><small>New visits will appear here.</small></div> : upcomingAppointments.map((appointment) => (
                <div className="upcoming-row" key={appointment.appointmentId}><time>{appointment.startsAt ? new Date(appointment.startsAt).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</time><div><strong>{appointment.patientId}</strong><small>{appointment.reason}</small></div></div>
              ))}
            </article>
          </section>
        </>
      ) : profileError ? (
        <section className="workspace-error" role="alert"><div><strong>Workspace profile unavailable</strong><small>{profileError}</small></div><button type="button" className="btn btn-primary" onClick={() => void loadWorkspace()}>Retry</button></section>
      ) : (
        <section className="clinical-workspace"><article className="panel schedule-panel"><div className="panel-head"><div><h2>Workspace</h2><p>{loading ? "Loading your role profile" : "Role profile unavailable"}</p></div></div><div className="compact-empty">{loading ? <><span className="route-spinner" /><strong>Loading workspace</strong></> : <><strong>Unable to determine workspace</strong><small>Retry to reconnect your role profile.</small><button type="button" className="btn btn-secondary" onClick={() => void loadWorkspace()}>Retry</button></>}</div></article></section>
      )}
    </>
  );
}
