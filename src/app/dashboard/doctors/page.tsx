import { CalendarDays, Clock3, Search, Star, Upload } from "lucide-react";
import Link from "next/link";
import { doctors } from "@/components/data";

export default function DoctorsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Medical team</p><h1>Doctors</h1><p className="subtle">Availability, schedules, and consultation profiles.</p></div><button className="btn btn-primary"><Upload size={15} /> Upload profile document</button></div>
      <div className="table-toolbar"><div className="table-search"><Search size={15} /><input placeholder="Search doctor or specialty" /></div><select aria-label="Department"><option>All departments</option><option>Cardiology</option><option>Neurology</option></select><select aria-label="Availability"><option>Any availability</option><option>Available today</option></select></div>
      <div className="doctor-grid">{doctors.map((doctor) => <article className="panel doctor-card" key={doctor.id}><div className="doctor-card-top"><span className={`avatar doctor-avatar ${doctor.color}`}>{doctor.initials}<i className="status-dot" /></span><span className={`availability ${doctor.status === "Available" ? "" : "busy"}`}>{doctor.status}</span></div><h2><Link href={`/dashboard/doctors/${doctor.id}`}>{doctor.name}</Link></h2><p>{doctor.specialty}</p><div className="doctor-meta"><span><Star size={13} /> {doctor.rating}</span><span>{doctor.patients} patients today</span></div><div className="doctor-details"><span><Clock3 size={14} /><small>Shift<strong>{doctor.shift}</strong></small></span><span><CalendarDays size={14} /><small>Seats today<strong>{doctor.seats} available</strong></small></span></div><div className="doctor-card-footer"><strong>PKR {doctor.fee}<small> / visit</small></strong><button className="btn btn-secondary btn-small">View profile</button></div></article>)}</div>
    </>
  );
}
