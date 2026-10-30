import { ArrowUpRight, CalendarClock, ChevronRight, Clock3, Plus, Users } from "lucide-react";
import Link from "next/link";
import { patients } from "@/components/data";

const stats = [
  { label: "Today's appointments", value: "0", note: "No visits scheduled", change: "0", icon: CalendarClock, tone: "blue" },
  { label: "My patients", value: "0", note: "No patients assigned", change: "0", icon: Users, tone: "violet" },
  { label: "Average wait time", value: "--", note: "No completed visits", change: "--", icon: Clock3, tone: "amber" },
];

export default function DashboardPage() {
  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Friday, October 30</p><h1>Good morning, Ayesha</h1><p className="subtle">Here is what is happening in your clinic today.</p></div>
        <div className="heading-actions"><button className="btn btn-secondary">View schedule</button><button className="btn btn-primary"><Plus size={15} /> New appointment</button></div>
      </div>
      <section className="stats-grid" aria-label="Daily overview">
        {stats.map(({ label, value, note, change, icon: Icon, tone }) => (
          <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div><span className="trend"><ArrowUpRight size={13} />{change}</span></article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel schedule-panel">
          <div className="panel-head"><div><h2>Today&apos;s schedule</h2><p>28 appointments · 3 rooms</p></div><button className="link-btn">View all <ChevronRight size={14} /></button></div>
          <div className="schedule-tabs"><button className="selected">All visits <span>28</span></button><button>Checked in <span>6</span></button><button>Completed <span>14</span></button></div>
          <div className="empty-state"><CalendarClock size={22} /><strong>No visits scheduled today</strong><small>Appointments will appear as they are booked.</small></div>
        </article>
        <aside className="panel activity-panel">
          <div className="panel-head"><div><h2>Recent patients</h2><p>Latest visits</p></div><Link href="/dashboard/patients" className="link-btn">See all</Link></div>
          <div className="patient-mini-list">{patients.slice(0,4).map((patient) => <Link href={`/dashboard/patients/${patient.id}`} className="patient-mini" key={patient.id}><span className={`avatar ${patient.color}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.id} · {patient.lastVisit}</small></span><ChevronRight size={15} /></Link>)}</div>
          <div className="capacity-card"><div><p>Next available</p><strong>12:30 PM</strong></div><span>4 seats left today</span><button className="btn btn-small">Book a seat</button></div>
        </aside>
      </section>
    </>
  );
}
