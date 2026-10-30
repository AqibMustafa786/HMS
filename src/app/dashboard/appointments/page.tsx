"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { useEffect, useState } from "react";

type Appointment = {
  appointmentId: string;
  patientId: string;
  doctorUid: string;
  startsAt: string | null;
  state: string;
  reason: string;
  location?: string | null;
};

export default function AppointmentsPage() {
  const [day, setDay] = useState(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    fetch("/api/appointments").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setAppointments(data.appointments ?? []);
    });
  }, []);

  const dayAppointments = appointments.filter((appointment) => {
    if (!appointment.startsAt) return false;
    const date = new Date(appointment.startsAt);
    return date.toDateString() === day.toDateString() && (stateFilter === "all" || appointment.state === stateFilter);
  });

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Clinic schedule</p><h1>Appointments</h1><p className="subtle">Manage visits, rooms, and check-ins.</p></div><AppointmentDialog /></div>
      <div className="toolbar">
        <div className="date-picker">
          <button aria-label="Previous day" onClick={() => setDay((value) => new Date(value.setDate(value.getDate() - 1)))}><ChevronLeft size={16} /></button>
          <strong><CalendarDays size={16} /> {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</strong>
          <button aria-label="Next day" onClick={() => setDay((value) => new Date(value.setDate(value.getDate() + 1)))}><ChevronRight size={16} /></button>
        </div>
        <label className="sr-only" htmlFor="appointment-filter">Appointment status</label>
        <select id="appointment-filter" value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} aria-label="Appointment status">
          <option value="all">All appointments</option><option value="booked">Booked</option><option value="checked-in">Checked in</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
      </div>
      {dayAppointments.length === 0
        ? <div className="panel empty-state"><CalendarDays size={22} /><strong>No appointments scheduled</strong><small>New appointments will appear here.</small></div>
        : <div className="panel data-table"><div className="table-row table-header"><span>Time</span><span>Patient</span><span>Reason</span><span>Location</span><span>Status</span></div>{dayAppointments.map((appointment) => <div className="table-row" key={appointment.appointmentId}><span>{new Date(appointment.startsAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span>{appointment.patientId}</span><span>{appointment.reason}</span><span>{appointment.location || "Not specified"}</span><span>{appointment.state}</span></div>)}</div>}
    </>
  );
}
