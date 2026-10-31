"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, CalendarDays, ChevronDown, CircleHelp, FileText, LayoutDashboard, LogOut,
  Menu, MessageCircle, Search, Settings, Stethoscope, Users, X, ClipboardList,
  FlaskConical, Pill, PanelLeftClose, PanelLeftOpen, BedDouble, Building2, CreditCard,
  Package, ShieldCheck, BarChart3, ClipboardCheck, HeartPulse,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

const adminNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Hospital" },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays, group: "Hospital" },
  { href: "/dashboard/patients", label: "Patients", icon: Users, group: "Hospital" },
  { href: "/dashboard/doctors", label: "Doctors & staff", icon: Stethoscope, group: "Hospital" },
  { href: "/dashboard/appointments?view=wards", label: "Wards & beds", icon: BedDouble, group: "Clinical" },
  { href: "/dashboard/prescriptions", label: "Pharmacy", icon: Pill, group: "Clinical" },
  { href: "/dashboard/laboratory-results", label: "Laboratory", icon: FlaskConical, group: "Clinical" },
  { href: "/dashboard/patients?view=departments", label: "Departments", icon: Building2, group: "Clinical" },
  { href: "/dashboard/appointments?view=billing", label: "Billing & payments", icon: CreditCard, group: "Finance" },
  { href: "/dashboard/appointments?view=insurance", label: "Insurance", icon: ShieldCheck, group: "Finance" },
  { href: "/dashboard/documents?view=inventory", label: "Inventory", icon: Package, group: "Operations" },
  { href: "/dashboard/documents?view=reports", label: "Reports & analytics", icon: BarChart3, group: "Operations" },
  { href: "/dashboard/settings", label: "Audit & settings", icon: ClipboardCheck, group: "Administration" },
];
const doctorNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays, group: "Workspace" },
  { href: "/dashboard/patients", label: "My patients", icon: Users, group: "Workspace" },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, group: "Workspace" },
  { href: "/dashboard/clinical-records", label: "Clinical records", icon: ClipboardList, group: "Clinical" },
  { href: "/dashboard/prescriptions", label: "Prescriptions", icon: Pill, group: "Clinical" },
  { href: "/dashboard/laboratory-results", label: "Laboratory results", icon: FlaskConical, group: "Clinical" },
  { href: "/dashboard/documents", label: "Documents", icon: FileText, group: "Clinical" },
];
const patientNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "My appointments", icon: CalendarDays },
  { href: "/dashboard/doctors", label: "Find doctors", icon: Stethoscope },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/documents", label: "My documents", icon: FileText },
];

const receptionistNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Front desk" },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays, group: "Front desk" },
  { href: "/dashboard/patients", label: "Patient registration", icon: Users, group: "Front desk" },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, group: "Front desk" },
];
const nurseNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Nursing" },
  { href: "/dashboard/patients", label: "Assigned patients", icon: Users, group: "Nursing" },
  { href: "/dashboard/clinical-records", label: "Observations & vitals", icon: HeartPulse, group: "Nursing" },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, group: "Nursing" },
];
const pharmacistNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Pharmacy" },
  { href: "/dashboard/prescriptions", label: "Dispensing queue", icon: Pill, group: "Pharmacy" },
  { href: "/dashboard/documents?view=inventory", label: "Medicine inventory", icon: Package, group: "Pharmacy" },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, group: "Pharmacy" },
];
const labNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Laboratory" },
  { href: "/dashboard/laboratory-results", label: "Samples & results", icon: FlaskConical, group: "Laboratory" },
  { href: "/dashboard/patients", label: "Patient references", icon: Users, group: "Laboratory" },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, group: "Laboratory" },
];
const accountantNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Finance" },
  { href: "/dashboard/appointments?view=billing", label: "Billing & payments", icon: CreditCard, group: "Finance" },
  { href: "/dashboard/appointments?view=insurance", label: "Insurance", icon: ShieldCheck, group: "Finance" },
  { href: "/dashboard/documents?view=reports", label: "Revenue reports", icon: BarChart3, group: "Finance" },
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
  const [profileError, setProfileError] = useState("");
  const roleName = profileRole.toLowerCase().replaceAll("_", " ");
  const nav = roleName.includes("patient")
    ? patientNav
    : roleName.includes("doctor")
      ? doctorNav
      : roleName.includes("receptionist")
        ? receptionistNav
        : roleName.includes("nurse")
          ? nurseNav
          : roleName.includes("pharmacist")
            ? pharmacistNav
            : roleName.includes("lab")
              ? labNav
              : roleName.includes("accountant")
                ? accountantNav
                : adminNav;
  const searchItems = [
    ...nav,
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
  const visibleSearchItems = searchItems.filter((item) =>
    item.label.toLowerCase().includes(globalSearch.trim().toLowerCase())
  ).slice(0, 6);
  useEffect(() => {
    let stopped = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.profile) throw new Error("Profile unavailable");
        if (stopped) return;
        setProfileName(data.profile.displayName || data.profile.email || "HMS account");
        setProfileRole(data.profile.role === "superadmin" ? "Super administrator" : data.profile.role || "Signed in");
      })
      .catch(() => {
        if (!stopped) setProfileError("Profile could not be loaded.");
      });
    return () => { stopped = true; };
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
  const pageLabel = pathname === "/dashboard"
    ? "Overview"
    : pathname.split("/").filter(Boolean).slice(1).map((part) => part.replaceAll("-", " ")).map((part) =>
      part.replace(/\b\w/g, (letter) => letter.toUpperCase())
    ).join(" / ");

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
      window.setTimeout(() => {
        // Refresh the session cookie boundary without dispatching router actions during logout.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }, 0);
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
        {profileError && !collapsed && <button className="sidebar-profile-error" type="button" onClick={() => window.location.reload()}>Profile unavailable · Retry</button>}
        <nav className="main-nav" aria-label="Main navigation">
          {["Workspace", "Clinical", "Hospital", "Finance", "Operations", "Administration", "Front desk", "Nursing", "Pharmacy", "Laboratory"].map((group) => {
            const items = nav.filter((item) => ("group" in item ? item.group === group : group === "Hospital"));
            if (!items.length) return null;
            return <div className="nav-group" key={group}><div className="nav-label">{group}</div>{items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-item ${active(href) ? "active" : ""}`}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
                {label === "Messages" && unreadNotifications > 0 && <b aria-label={`${unreadNotifications} unread messages`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</b>}
              </Link>
            ))}</div>;
          })}
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
          <button className="icon-btn header-sidebar-toggle" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <div className="breadcrumb" aria-label="Breadcrumb"><span>HMS</span><b>/</b><strong>{pageLabel}</strong></div>
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
              <button type="button" className="sync-state" aria-expanded={syncOpen} onClick={() => setSyncOpen((open) => !open)}><span />System online</button>
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
