"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, CalendarDays, ChevronDown, CircleHelp, FileText, LayoutDashboard, LogOut,
  Menu, MessageCircle, Search, Settings, Stethoscope, Users, X, ClipboardList,
  FlaskConical, Pill, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

const adminNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
];
const doctorNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "My schedule", icon: CalendarDays },
  { href: "/dashboard/patients", label: "My patients", icon: Users },
  { href: "/dashboard/clinical-records", label: "Clinical records", icon: ClipboardList },
  { href: "/dashboard/prescriptions", label: "Prescriptions", icon: Pill },
  { href: "/dashboard/laboratory-results", label: "Laboratory results", icon: FlaskConical },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
];
const patientNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "My appointments", icon: CalendarDays },
  { href: "/dashboard/doctors", label: "Find doctors", icon: Stethoscope },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/documents", label: "My documents", icon: FileText },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState("HMS account");
  const [profileRole, setProfileRole] = useState("Signed in");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const roleName = profileRole.toLowerCase().replaceAll("_", " ");
  const nav = roleName.includes("patient")
    ? patientNav
    : roleName.includes("doctor") || roleName.includes("pending")
      ? doctorNav
      : adminNav;
  const searchItems = [
    ...nav,
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
  const visibleSearchItems = searchItems.filter((item) =>
    item.label.toLowerCase().includes(globalSearch.trim().toLowerCase())
  ).slice(0, 6);
  useEffect(() => {
    fetch("/api/profile").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setProfileName(data.profile.displayName || data.profile.email || "HMS account");
      setProfileRole(data.profile.role === "superadmin" ? "Super administrator" : data.profile.role || "Signed in");
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("[data-global-search]")?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    const seen = new Set<string>();
    let stopped = false;
    async function pollNotifications() {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const notifications = data.notifications ?? [];
      if (!stopped) setUnreadNotifications(notifications.length);
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      for (const item of notifications) {
        if (seen.has(item.notificationId)) continue;
        seen.add(item.notificationId);
        new Notification(String(item.title ?? "New Careflow message"), {
          body: String(item.body ?? ""),
          tag: String(item.notificationId),
        });
      }
    }
    void pollNotifications();
    const interval = window.setInterval(() => void pollNotifications(), 1500);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, []);
  const initials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SA";
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const loggingOut = useRef(false);

  async function openNotifications() {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if ("Notification" in window && Notification.permission === "granted") {
      setUnreadNotifications(0);
      router.push("/dashboard/messages");
      return;
    }
    router.push("/dashboard/messages");
  }

  async function logout() {
    if (loggingOut.current) return;
    loggingOut.current = true;
    try {
      const { auth } = getFirebaseClient();
      await Promise.all([
        fetch("/api/session", { method: "DELETE", credentials: "same-origin" }),
        signOut(auth),
      ]);
      router.replace("/login");
      router.refresh();
    } finally {
      loggingOut.current = false;
    }
  }

  return (
    <div className={`app-frame ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <Link href="/dashboard" className="brand" aria-label="Careflow home">
            <span className="brand-mark"><span /></span>
            <span>Careflow</span>
          </Link>
          <button className="icon-btn desktop-collapse" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={17} /></button>
        </div>
        <div className="nav-label">Workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-item ${active(href) ? "active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {label === "Messages" && unreadNotifications > 0 && (
                <b aria-label={`${unreadNotifications} unread messages`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</b>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/dashboard/help" className="nav-item"><CircleHelp size={17} /><span>Help center</span></Link>
          <Link href="/dashboard/settings" className={`nav-item ${active("/dashboard/settings") ? "active" : ""}`}><Settings size={17} /><span>Settings</span></Link>
          <button className="profile-switcher" type="button" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>
            <span className="avatar avatar-doctor">{initials}<span className="status-dot" /></span>
            <span><strong>{profileName}</strong><small>{profileRole}</small></span>
            <ChevronDown size={15} />
          </button>
          {accountMenuOpen && (
            <div className="account-menu">
              <Link href="/dashboard/settings" onClick={() => setAccountMenuOpen(false)}>Account settings</Link>
              <button type="button" onClick={logout}><LogOut size={14} /> Log out</button>
            </div>
          )}
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <main className="workspace">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <div className="global-search">
            <div className="searchbox"><Search size={16} /><input data-global-search aria-label="Search workspace" placeholder="Search workspace..." value={globalSearch} onFocus={() => setSearchOpen(true)} onChange={(event) => { setGlobalSearch(event.target.value); setSearchOpen(true); }} /><kbd>⌘ K</kbd></div>
            {searchOpen && (
              <div className="global-search-menu">
                {visibleSearchItems.length ? visibleSearchItems.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => { setSearchOpen(false); setGlobalSearch(""); }}><Icon size={15} /><span>{label}</span></Link>
                )) : <span className="global-search-empty">No matching pages</span>}
              </div>
            )}
          </div>
          <div className="top-actions">
            <div className="sync-control">
              <button type="button" className="sync-state" aria-expanded={syncOpen} onClick={() => setSyncOpen((open) => !open)}><span />Offline ready</button>
              {syncOpen && <div className="sync-menu">Workspace is available offline.<button type="button" onClick={() => setSyncOpen(false)}>Got it</button></div>}
            </div>
            <button className="icon-btn notification-btn" aria-label="Notifications" onClick={() => void openNotifications()}><Bell size={17} />{unreadNotifications > 0 && <i />}</button>
            <button type="button" className="avatar avatar-button avatar-doctor" aria-label="Account menu" onClick={() => setAccountMenuOpen((open) => !open)}>{initials}<span className="status-dot" /></button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
