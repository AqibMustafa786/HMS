"use client";

import { ChevronRight, Filter, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PatientRegistry } from "@/components/patient-registry";

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Array<{ id: string; givenName: string; familyName: string; sex: string; dateOfBirth: string | null; assignedDoctorUid: string | null; lifecycleState: string }>>([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/patients"), fetch("/api/profile")]).then(async ([patientsResponse, profileResponse]) => {
      const patientData = await patientsResponse.json().catch(() => null) as { patients?: typeof patients } | null;
      const profileData = await profileResponse.json().catch(() => null) as { profile?: { role?: string } } | null;
      setPatients(patientData?.patients ?? []);
      setRole(profileData?.profile?.role ?? "");
    }).catch(() => undefined);
  }, []);

  const filteredPatients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((patient) =>
      [`${patient.givenName} ${patient.familyName}`, patient.id, patient.assignedDoctorUid ?? ""].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [patients, query]);

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">{role === "doctor" ? "Assigned care" : "Patient directory"}</p><h1>{role === "doctor" ? "My patients" : "Patients"}</h1><p className="subtle">{patients.length} registered records</p></div>{role !== "patient" && <PatientRegistry />}</div>
      <div className="table-toolbar"><div className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or patient ID" /></div><button className="btn btn-secondary" type="button" onClick={() => setQuery("")}><Filter size={15} /> Clear filter</button><select aria-label="Sort patients" defaultValue="recent"><option value="recent">Recently visited</option><option value="name">Patient name</option></select></div>
      {filteredPatients.length === 0
        ? <div className="panel empty-state"><strong>No patients registered</strong><small>Register a patient using the secure patient registry.</small></div>
        : <div className="panel data-table"><div className="table-row table-header"><span>Patient</span><span>ID</span><span>Date of birth</span><span>Sex</span><span>Status</span><span /></div>{filteredPatients.map((patient) => {
          const name = `${patient.givenName} ${patient.familyName}`.trim();
          const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
          return <Link href={`/dashboard/patients/${patient.id}`} className="table-row" key={patient.id}><span className="patient-cell"><span className="avatar">{initials}</span><span><strong>{name}</strong></span></span><span>{patient.id}</span><span>{patient.dateOfBirth || "Not recorded"}</span><span>{patient.sex}</span><span><i className="table-status" />{patient.lifecycleState}</span><ChevronRight size={15} /></Link>;
        })}</div>}
    </>
  );
}
