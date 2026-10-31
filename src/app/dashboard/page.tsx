"use client";

import { CalendarDays, ChevronRight, ClipboardCheck, FlaskConical, Users } from "lucide-react";
import Link from "next/link";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { useEffect, useMemo, useState } from "react";

type Appointment = { appointmentId: string; patientId: string; startsAt: string | null; reason: string; state: string };
type Patient = { id: string; givenName: string; familyName: string; lifecycleState: string };

export default function DashboardPage() {
  const [role, setRole] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const clock = window.setTimeout(() => setNow(Date.now()), 0);
    Promise.all([fetch("/api/profile"), fetch("/api/appointments"), fetch("/api/patients")])
      .then(async ([profileResponse, appointmentsResponse, patientsResponse]) => {
        const profileData = await profileResponse.json().catch(() => null) as { profile?: { role?: string } } | null;
        const appointmentData = await appointmentsResponse.json().catch(() => null) as { appointments?: Appointment[] } | null;
        const patientData = await patientsResponse.json().catch(() => null) as { patients?: Patient[] } | null;
        setRole(profileData?.profile?.role ?? "");
        setAppointments(appointmentData?.appointments ?? []);
        setPatients(patientData?.patients ?? []);
      })
      .finally(() => setLoading(false));
    return () => window.clearTimeout(clock);
  }, []);

  const isDoctor = role === "doctor";
  const isPatient = role === "patient";
  const today = new Date().toDateString();
  const todaysAppointments = useMemo(() => appointments.filter((appointment) =>
    appointment.startsAt && new Date(appointment.startsAt).toDateString() === today
  ).sort((a, b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime()), [appointments, today]);
  const upcomingAppointments = useMemo(() => appointments.filter((appointment) =>
    appointment.startsAt && new Date(appointment.startsAt).getTime() > now
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

      {isDoctor ? (
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
      ) : (
        <section className="clinical-workspace"><article className="panel schedule-panel"><div className="panel-head"><div><h2>Workspace</h2><p>Role-specific overview</p></div></div><div className="compact-empty"><strong>Loading workspace</strong><small>If this remains visible, refresh the page to load your role profile.</small></div></article></section>
      )}
    </>
  );
}
