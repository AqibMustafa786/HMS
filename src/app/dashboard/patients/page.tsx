"use client";

import { ChevronRight, Filter, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { patients } from "@/components/data";
import { PatientRegistry } from "@/components/patient-registry";

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const filteredPatients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((patient) =>
      [patient.name, patient.id, patient.doctor].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [query]);

  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Patient directory</p><h1>Patients</h1><p className="subtle">0 registered records</p></div><PatientRegistry /></div>
      <div className="table-toolbar"><div className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or patient ID" /></div><button className="btn btn-secondary" type="button" onClick={() => setQuery("")}><Filter size={15} /> Clear filter</button><select aria-label="Sort patients" defaultValue="recent"><option value="recent">Recently visited</option><option value="name">Patient name</option></select></div>
      {filteredPatients.length === 0
        ? <div className="panel empty-state"><strong>No patients registered</strong><small>Register a patient using the secure patient registry.</small></div>
        : <div className="panel data-table"><div className="table-row table-header"><span>Patient</span><span>ID</span><span>Assigned doctor</span><span>Last visit</span><span>Status</span><span /></div>{filteredPatients.map((patient) => <Link href={`/dashboard/patients/${patient.id}`} className="table-row" key={patient.id}><span className="patient-cell"><span className={`avatar ${patient.color}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.age} years · {patient.sex}</small></span></span><span>{patient.id}</span><span>{patient.doctor}</span><span>{patient.lastVisit}</span><span><i className="table-status" />{patient.status}</span><ChevronRight size={15} /></Link>)}</div>}
    </>
  );
}
