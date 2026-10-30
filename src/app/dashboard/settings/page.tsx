"use client";

import { Bell, Building2, Check, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Profile = {
  email: string;
  displayName: string;
  phone: string;
  role: string;
  title: string;
  departmentId: string;
  preferences: { appointmentUpdates?: boolean; clinicalMessages?: boolean; requireRecentAuth?: boolean };
};

export default function SettingsPage() {
  const [section, setSection] = useState("Profile");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => setProfile(data?.profile ?? null))
      .finally(() => setLoading(false));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      displayName: String(form.get("displayName") ?? profile.displayName),
      phone: String(form.get("phone") ?? profile.phone),
      title: String(form.get("title") ?? profile.title),
      departmentId: String(form.get("departmentId") ?? profile.departmentId),
      preferences: {
        appointmentUpdates: form.get("appointmentUpdates") === "on",
        clinicalMessages: form.get("clinicalMessages") === "on",
        requireRecentAuth: form.get("requireRecentAuth") === "on",
      },
    };
    setSaving(true);
    setSaved("");
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      setProfile((current) => current ? { ...current, ...payload } : current);
      setSaved(`${section} changes saved.`);
    } else {
      setSaved("Changes could not be saved.");
    }
    setSaving(false);
  }

  const sections = [["Profile", UserRound], ["Clinic", Building2], ["Notifications", Bell], ["Privacy & security", ShieldCheck]] as const;

  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Workspace</p><h1>Settings</h1><p className="subtle">Manage your account and workspace preferences.</p></div>
      </div>
      <div className="settings-layout">
        <aside className="settings-nav panel">
          {sections.map(([name, Icon]) => (
            <button key={name} type="button" className={section === name ? "active" : ""} onClick={() => { setSection(name); setSaved(""); }}>
              <Icon size={15} />{name}
            </button>
          ))}
        </aside>
        {loading ? <main className="panel settings-main settings-loading">Loading account...</main> : profile && (
          <form className="panel settings-main" onSubmit={save}>
            <div className="panel-head">
              <div><h2>{section === "Profile" ? "Personal profile" : section}</h2><p>{profile.role === "superadmin" ? "Super administrator account" : "Account and workspace preferences."}</p></div>
              <span className="settings-role">{profile.role === "superadmin" ? "Super admin" : profile.role}</span>
            </div>
            {section === "Profile" ? (
              <>
                <div className="settings-avatar">
                  <span className="avatar profile-avatar avatar-doctor">{initials(profile.displayName)}</span>
                  <div><strong>{profile.displayName || profile.email}</strong><small>{profile.email}</small></div>
                </div>
                <div className="form-grid">
                  <label>Full name<input name="displayName" defaultValue={profile.displayName} required /></label>
                  <label>Account email<input value={profile.email} readOnly /></label>
                  <label>Phone<input name="phone" type="tel" defaultValue={profile.phone} placeholder="Add phone number" /></label>
                  <label>Account role<input value={profile.role === "superadmin" ? "Super administrator" : profile.role} readOnly /></label>
                  {profile.role !== "superadmin" && (
                    <>
                      <label>Department<select name="departmentId" defaultValue={profile.departmentId}><option value="">Select department</option><option value="cardiology">Cardiology</option><option value="neurology">Neurology</option><option value="general-medicine">General medicine</option></select></label>
                      <label>Position<input name="title" defaultValue={profile.title} placeholder="Professional title" /></label>
                    </>
                  )}
                </div>
              </>
            ) : section === "Notifications" ? (
              <div className="preferences-grid">
                <label><input name="appointmentUpdates" type="checkbox" defaultChecked={profile.preferences.appointmentUpdates} /><span><strong>Appointment updates</strong><small>Notify me about schedule changes.</small></span></label>
                <label><input name="clinicalMessages" type="checkbox" defaultChecked={profile.preferences.clinicalMessages} /><span><strong>Clinical messages</strong><small>Notify me about new assigned conversations.</small></span></label>
              </div>
            ) : section === "Clinic" ? (
              <div className="settings-empty-panel"><strong>Workspace administration</strong><small>Clinic details are managed from the authorized administration area.</small></div>
            ) : (
              <div className="preferences-grid">
                <label><input name="requireRecentAuth" type="checkbox" defaultChecked={profile.preferences.requireRecentAuth} /><span><strong>Require recent authentication</strong><small>Protect sensitive account and clinical actions with a recent sign-in.</small></span></label>
              </div>
            )}
            {saved && <p className="registry-message" role="status">{saved}</p>}
            <div className="settings-footer">
              <button className="btn btn-secondary" type="reset" disabled={saving}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={saving}><Check size={15} />{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SA";
}
