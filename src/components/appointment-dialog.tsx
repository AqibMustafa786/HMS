"use client";

import { CalendarDays, Plus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type AvailableDoctor = {
  uid: string;
  displayName?: string;
  email?: string;
  title?: string;
  status?: string;
};

export function AppointmentDialog({ label = "New appointment" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [doctors, setDoctors] = useState<AvailableDoctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    const start = window.setTimeout(() => {
      setDoctorsLoading(true);
      setDoctorsError("");
      fetch("/api/roles", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "Available doctors could not be loaded.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setDoctors(Array.isArray(data?.doctors) ? data.doctors.filter((doctor: AvailableDoctor) => doctor.status !== "disabled") : []);
      })
      .catch((error) => {
        if (active) setDoctorsError(error instanceof Error ? error.message : "Available doctors could not be loaded.");
      })
      .finally(() => {
        if (active) setDoctorsLoading(false);
      });
    }, 0);
    return () => { active = false; window.clearTimeout(start); };
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = {
      patientId: String(form.get("patientId") ?? ""),
      doctorUid: String(form.get("doctorUid") ?? ""),
      date: String(form.get("date") ?? ""),
      time: String(form.get("time") ?? ""),
      durationMinutes: Number(form.get("durationMinutes") ?? 30),
      reason: String(form.get("reason") ?? ""),
      location: String(form.get("location") ?? ""),
    };

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(result?.error ?? "Appointment could not be created.");
    } else {
      setMessage("Appointment created.");
      event.currentTarget.reset();
    }
    setBusy(false);
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={14} />{label}</button>
      {open && (
        <div className="registry-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="panel registry-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-head"><div><p className="eyebrow">Clinic scheduling</p><h2>New appointment</h2></div><button className="icon-btn" type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={15} /></button></div>
            <form className="registry-form" onSubmit={submit}>
              <div className="registry-fields">
                <label>Patient ID<input name="patientId" required placeholder="PT-XXXXXXXXXX" /></label>
                <label>Doctor<select name="doctorUid" required disabled={doctorsLoading || doctors.length === 0}>
                  <option value="">
                    {doctorsLoading ? "Loading available doctors..." : doctors.length ? "Select an available doctor" : "No available doctors"}
                  </option>
                  {doctors.map((doctor) => {
                    const name = doctor.displayName?.trim() || doctor.email?.trim() || `Doctor ${doctor.uid.slice(0, 8)}`;
                    return <option key={doctor.uid} value={doctor.uid}>{name}{doctor.title ? ` — ${doctor.title}` : ""}</option>;
                  })}
                </select></label>
                <label>Date<input name="date" type="date" required /></label>
                <label>Time<input name="time" type="time" required /></label>
                <label>Duration<select name="durationMinutes" defaultValue="30"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>
                <label>Location<input name="location" placeholder="Room or online" /></label>
              </div>
              <label>Reason<input name="reason" required maxLength={160} placeholder="Consultation reason" /></label>
              {doctorsError && <p className="registry-message" role="alert">{doctorsError}</p>}
              {message && <p className="registry-message" role="status">{message}</p>}
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : <><CalendarDays size={14} /> Create appointment</>}</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
