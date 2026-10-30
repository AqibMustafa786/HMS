import { ChevronRight, FileQuestion, LifeBuoy, MessageCircle, ShieldQuestion } from "lucide-react";

export default function HelpPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Support</p><h1>How can we help?</h1><p className="subtle">Browse guidance or contact the support team.</p></div></div>
      <div className="help-grid"><button className="panel help-card"><span><LifeBuoy size={19} /></span><strong>Getting started</strong><p>Set up your clinic, staff accounts, and first appointments.</p><ChevronRight size={16} /></button><button className="panel help-card"><span><FileQuestion size={19} /></span><strong>Clinical workflows</strong><p>Learn about patient records, visits, and documents.</p><ChevronRight size={16} /></button><button className="panel help-card"><span><ShieldQuestion size={19} /></span><strong>Privacy & access</strong><p>Understand roles, permissions, and audit history.</p><ChevronRight size={16} /></button></div>
      <section className="panel support-banner"><span><MessageCircle size={20} /></span><div><h2>Need personal assistance?</h2><p>The support team is available Monday to Friday, 09:00–18:00.</p></div><button className="btn btn-primary">Contact support</button></section>
    </>
  );
}
