"use client";

import { Activity, CalendarClock, ChevronRight, Clock3, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { patients } from "@/components/data";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { useState } from "react";

export default function DashboardPage() {
  const [scheduleTab, setScheduleTab] = useState("All visits");
  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Clinic overview</p><h1>Good morning</h1><p className="subtle">Here is what is happening in your clinic today.</p></div>
        <div className="heading-actions"><a className="btn btn-secondary" href="/dashboard/appointments">View schedule</a><AppointmentDialog /></div>
      </div>
      <section className="command-strip" aria-label="Daily overview">
        <div><span className="command-icon"><Activity size={16} /></span><div><small>Appointments today</small><strong>0</strong><span>No visits scheduled</span></div></div>
        <div><span className="command-icon violet"><Users size={16} /></span><div><small>Patients</small><strong>0</strong><span>No assigned records</span></div></div>
        <div><span className="command-icon amber"><Clock3 size={16} /></span><div><small>Average wait</small><strong>--</strong><span>No completed visits</span></div></div>
        <div><span className="command-icon blue"><ShieldCheck size={16} /></span><div><small>System status</small><strong className="status-text">Operational</strong><span>All services available</span></div></div>
      </section>
      <section className="dashboard-grid">
        <article className="panel schedule-panel">
          <div className="panel-head"><div><h2>Today&apos;s schedule</h2><p>0 appointments</p></div><Link href="/dashboard/appointments" className="link-btn">View all <ChevronRight size={14} /></Link></div>
          <div className="schedule-tabs">{["All visits", "Checked in", "Completed"].map((tab) => <button key={tab} type="button" className={scheduleTab === tab ? "selected" : ""} onClick={() => setScheduleTab(tab)}>{tab}<span>0</span></button>)}</div>
          <div className="schedule-empty">
            <span className="schedule-empty-icon"><CalendarClock size={19} /></span>
            <div><strong>No visits scheduled today</strong><small>Appointments and clinical queue activity will appear here.</small></div>
            <AppointmentDialog label="Create appointment" />
          </div>
        </article>
        <aside className="panel activity-panel">
          <div className="panel-head"><div><h2>Recent patients</h2><p>Latest visits</p></div><Link href="/dashboard/patients" className="link-btn">See all</Link></div>
          <div className="patient-mini-list">{patients.slice(0,4).map((patient) => <Link href={`/dashboard/patients/${patient.id}`} className="patient-mini" key={patient.id}><span className={`avatar ${patient.color}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.id} · {patient.lastVisit}</small></span><ChevronRight size={15} /></Link>)}</div>
          {patients.length === 0 && <div className="recent-patient-empty"><Users size={17} /><span><strong>Patient activity is empty</strong><small>Recent visits will appear here.</small></span></div>}
          <div className="availability-summary">
            <div className="availability-ring"><span>0</span><small>seats</small></div>
            <div><small>Next opening</small><strong>Not configured</strong><span>Availability is empty</span></div>
            <Link href="/dashboard/appointments" className="link-btn">Manage <ChevronRight size={12} /></Link>
          </div>
        </aside>
      </section>
    </>
  );
}
