"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/features/auth/auth-provider";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tools/sync", label: "Tool sync", icon: ChartNoAxesCombined },
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const title =
    [...navigation, { href: "/admin/users", label: "User administration" }, { href: "/settings/profile", label: "Profile" }]
      .find((item) => pathname.startsWith(item.href))?.label ?? "DHA";

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // The server clears the cookie even when backend logout fails.
    }
    toast.success("Signed out");
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="product-shell">
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><ShieldCheck /></span>
          <span><strong>DHA</strong><small>Digital Assessment</small></span>
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <nav aria-label="Primary navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={pathname.startsWith(href) ? "active" : ""} onClick={() => setOpen(false)}>
              <Icon />{label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin/users" className={pathname.startsWith("/admin") ? "active" : ""} onClick={() => setOpen(false)}>
              <Users />Admin users
            </Link>
          )}
        </nav>
        <div className="sidebar-footer">
          <Link href="/settings/profile"><UserRound />Profile</Link>
          <Link href="/settings/security"><Settings />Security</Link>
          <button onClick={logout}><LogOut />Sign out</button>
        </div>
      </aside>
      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <div className="app-column">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div><span>Digital Assessment Platform</span><strong>{title}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications"><Bell /></button>
            <div className="identity">
              <span>{(user?.display_name || user?.email || "User").slice(0, 1).toUpperCase()}</span>
              <div><strong>{user?.display_name || user?.username || "Account"}</strong><small>{user?.role || "Loading session"}</small></div>
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
