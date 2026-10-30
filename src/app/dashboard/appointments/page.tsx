import { CalendarDays, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";

const appointments = [["09:00","Hamza Tariq","Initial consultation","Room 2","HT","blue","Checked in"],["09:30","Sara Khan","Cardiac follow-up","Room 1","SK","violet","In consultation"],["10:15","Bilal Ahmed","ECG review","Room 3","BA","amber","Next"],["11:00","Amina Raza","Routine check-up","Waiting","AR","rose","Upcoming"],["12:30","Raza Hussain","Medication review","Waiting","RH","blue","Upcoming"]];

export default function AppointmentsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Clinic schedule</p><h1>Appointments</h1><p className="subtle">Manage visits, rooms, and check-ins.</p></div><button className="btn btn-primary"><Plus size={15} /> New appointment</button></div>
      <div className="toolbar"><div className="date-picker"><button aria-label="Previous day"><ChevronLeft size={16} /></button><strong><CalendarDays size={16} /> Fri, Oct 30</strong><button aria-label="Next day"><ChevronRight size={16} /></button></div><button className="btn btn-secondary"><Filter size={15} /> Filters</button></div>
      <div className="appointment-list panel"><div className="list-head"><span>Time</span><span>Patient</span><span>Visit type</span><span>Location</span><span>Status</span><span /></div>{appointments.map(([time,name,reason,room,initials,color,status]) => <div className="appointment-list-row" key={name}><strong>{time}</strong><span className="patient-cell"><span className={`avatar ${color}`}>{initials}</span><span><strong>{name}</strong><small>PT-1048</small></span></span><span>{reason}</span><span>{room}</span><span className={`pill ${status === "Checked in" || status === "In consultation" ? "pill-green":"pill-gray"}`}>{status}</span><button>•••</button></div>)}</div>
    </>
  );
}
