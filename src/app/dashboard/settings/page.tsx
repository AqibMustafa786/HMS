import { Bell, Building2, Check, ShieldCheck, UserRound } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Workspace</p><h1>Settings</h1><p className="subtle">Manage your account and clinic preferences.</p></div></div>
      <div className="settings-layout"><aside className="settings-nav panel"><button className="active"><UserRound size={16} />Profile</button><button><Building2 size={16} />Clinic</button><button><Bell size={16} />Notifications</button><button><ShieldCheck size={16} />Privacy & security</button></aside><main className="panel settings-main"><div className="panel-head"><div><h2>Personal profile</h2><p>Information shown on your staff profile.</p></div></div><div className="settings-avatar"><span className="avatar profile-avatar avatar-doctor">AM</span><div><button className="btn btn-secondary btn-small">Change photo</button><small>JPG or PNG, up to 5 MB</small></div></div><div className="form-grid"><label>First name<input defaultValue="Ayesha" /></label><label>Last name<input defaultValue="Malik" /></label><label>Professional email<input defaultValue="ayesha.malik@example.com" /></label><label>Phone<input defaultValue="+92 300 555 0186" /></label><label>Department<select defaultValue="Cardiology"><option>Cardiology</option><option>Neurology</option></select></label><label>Position<input defaultValue="Consultant Cardiologist" /></label></div><div className="settings-footer"><button className="btn btn-secondary">Cancel</button><button className="btn btn-primary"><Check size={15} /> Save changes</button></div></main></div>
    </>
  );
}
