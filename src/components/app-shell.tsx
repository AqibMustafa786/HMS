"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarDays, ChevronDown, CircleHelp, FileText, LayoutDashboard,
  Menu, MessageCircle, Search, Settings, Stethoscope, Users, WifiOff, X,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <Link href="/dashboard" className="brand" aria-label="Careflow home">
            <span className="brand-mark"><span /></span>
            <span>Careflow</span>
          </Link>
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={17} /></button>
        </div>
        <div className="nav-label">Workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-item ${active(href) ? "active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/dashboard/help" className="nav-item"><CircleHelp size={17} /><span>Help center</span></Link>
          <Link href="/dashboard/settings" className={`nav-item ${active("/dashboard/settings") ? "active" : ""}`}><Settings size={17} /><span>Settings</span></Link>
          <button className="profile-switcher">
            <span className="avatar avatar-doctor">AM<span className="status-dot" /></span>
            <span><strong>HMS account</strong><small>Signed in</small></span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <main className="workspace">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <div className="searchbox"><Search size={16} /><input aria-label="Search patients and doctors" placeholder="Search patients, doctors, visits..." /><kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <span className="sync-state"><span /><WifiOff size={13} /> Offline ready</span>
            <button className="icon-btn notification-btn" aria-label="Notifications"><Bell size={17} /><i /></button>
            <span className="avatar avatar-doctor">AM<span className="status-dot" /></span>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
