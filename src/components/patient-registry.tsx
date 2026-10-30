"use client";

import { Plus, Search, X } from "lucide-react";
import { FormEvent, useState } from "react";

type PatientLookupResult = {
  id: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  sex: string;
};

export function PatientRegistry() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"find" | "create">("find");
  const [identityKey, setIdentityKey] = useState("");
  const [message, setMessage] = useState("");
  const [patient, setPatient] = useState<PatientLookupResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setPatient(null);

    const form = new FormData(event.currentTarget);
    const body = mode === "find"
      ? { action: "find", identityKey }
      : {
          action: "create",
          identityKey,
          givenName: String(form.get("givenName") ?? ""),
          familyName: String(form.get("familyName") ?? ""),
          dateOfBirth: String(form.get("dateOfBirth") ?? ""),
          sex: String(form.get("sex") ?? "unknown"),
          email: String(form.get("email") ?? "") || undefined,
        };

    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(result?.error ?? (response.status === 401 ? "Sign in to access patient records." : "Request failed."));
    } else if (mode === "find") {
      setPatient(result.patient);
    } else {
      setMessage(`Patient registered as ${result.patientId}.`);
      setIdentityKey("");
    }
    setBusy(false);
  }

  return (
    <>
      <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
        <Plus size={15} /> Add patient
      </button>
      {open && (
        <div className="registry-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="panel registry-dialog" role="dialog" aria-modal="true" aria-labelledby="registry-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <div><p className="eyebrow">Secure patient registry</p><h2 id="registry-title">Patient identity</h2></div>
              <button className="icon-btn" type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <div className="registry-tabs">
              <button type="button" className={mode === "find" ? "active" : ""} onClick={() => { setMode("find"); setMessage(""); setPatient(null); }}>Find by key</button>
              <button type="button" className={mode === "create" ? "active" : ""} onClick={() => { setMode("create"); setMessage(""); setPatient(null); }}>Register patient</button>
            </div>
            <form className="registry-form" onSubmit={submit}>
              <label>Unique patient key
                <div className="table-search"><Search size={15} /><input value={identityKey} onChange={(event) => setIdentityKey(event.target.value)} required minLength={3} maxLength={64} placeholder="National ID, MRN, or hospital key" /></div>
              </label>
              {mode === "create" && (
                <div className="registry-fields">
                  <label>Given name<input name="givenName" required maxLength={80} /></label>
                  <label>Family name<input name="familyName" required maxLength={80} /></label>
                  <label>Email<input name="email" type="email" maxLength={254} /></label>
                  <label>Date of birth<input name="dateOfBirth" type="date" required /></label>
                  <label>Sex<select name="sex" defaultValue="unknown"><option value="female">Female</option><option value="male">Male</option><option value="intersex">Intersex</option><option value="unknown">Unknown</option></select></label>
                </div>
              )}
              <button className="btn btn-primary" disabled={busy}>{busy ? "Working..." : mode === "find" ? "Find patient" : "Register patient"}</button>
            </form>
            {message && <p className="registry-message" role="status">{message}</p>}
            {patient && (
              <div className="registry-result">
                <strong>{patient.givenName} {patient.familyName}</strong>
                <span>{patient.id} · {patient.sex} · DOB {patient.dateOfBirth}</span>
                <a href={`/dashboard/patients/${patient.id}`}>Open patient profile</a>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
