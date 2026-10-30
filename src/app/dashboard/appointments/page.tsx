import { CalendarDays, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Clinic schedule</p><h1>Appointments</h1><p className="subtle">Manage visits, rooms, and check-ins.</p></div><button className="btn btn-primary"><Plus size={15} /> New appointment</button></div>
      <div className="toolbar"><div className="date-picker"><button aria-label="Previous day"><ChevronLeft size={16} /></button><strong><CalendarDays size={16} /> Fri, Oct 30</strong><button aria-label="Next day"><ChevronRight size={16} /></button></div><button className="btn btn-secondary"><Filter size={15} /> Filters</button></div>
      <div className="panel empty-state"><CalendarDays size={22} /><strong>No appointments scheduled</strong><small>New appointments will appear here.</small></div>
    </>
  );
}
