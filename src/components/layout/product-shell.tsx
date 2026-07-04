import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChartNoAxesCombined,
  ClipboardList,
  ClipboardCheck,
  FileText,
  Globe2,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Bot,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/features/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WorkspaceSwitcher } from "@/features/workspaces/components/WorkspaceSwitcher";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/system/health", label: "System health", icon: HeartPulse },
  { href: "/system/operations", label: "Operations", icon: Settings },
  { href: "/workspaces", label: "Workspaces", icon: Globe2 },
  { href: "/reviews", label: "Reviews", icon: ClipboardCheck },
  { href: "/crawler", label: "Crawler", icon: Bot },
  { href: "/baselines", label: "Baselines", icon: ClipboardList },
  { href: "/tools/sync", label: "Tool sync", icon: ChartNoAxesCombined },
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const workspaceMatch = pathname.match(/^\/workspaces\/([^/]+)/);
  const workspaceId = workspaceMatch?.[1];
  const workspaceNavigation =
    workspaceId && workspaceId !== "new"
      ? [
          { href: `/workspaces/${workspaceId}`, label: "Overview", icon: LayoutDashboard },
          { href: `/workspaces/${workspaceId}/properties`, label: "Properties", icon: Globe2 },
          { href: `/workspaces/${workspaceId}/discovery`, label: "Discovery", icon: Search },
          { href: `/workspaces/${workspaceId}/competitors`, label: "Competitors", icon: Users },
          { href: `/workspaces/${workspaceId}/scope`, label: "Scope", icon: ShieldCheck },
          { href: `/workspaces/${workspaceId}/assessments`, label: "Assessments", icon: ClipboardCheck },
          { href: `/workspaces/${workspaceId}/reports`, label: "Reports", icon: FileText },
          { href: `/workspaces/${workspaceId}/tools`, label: "Tools", icon: Wrench },
          { href: `/workspaces/${workspaceId}/tool-runs`, label: "Tool runs", icon: ClipboardList },
        ]
      : [];

  const queryClient = useQueryClient();

  const title =
    [
      ...navigation,
      { href: "/admin/users", label: "User administration" },
      { href: "/admin/methodologies", label: "Methodologies" },
      { href: "/admin/tools", label: "Admin tools" },
      { href: "/admin/permissions", label: "Permissions" },
      { href: "/system/operations", label: "Operations" },
      { href: "/crawler", label: "Crawler" },
      { href: "/reviews", label: "Reviews" },
      { href: "/settings/profile", label: "Profile" },
    ].find((item) => pathname.startsWith(item.href))?.label ?? "DHA";

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Server clears the cookie even on backend failure
    }
    queryClient.setQueryData(["session"], null);
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    appToast.success("Signed out");
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Scrim */}
      {open && (
        <button
          className="fixed inset-0 z-[25] border-0 bg-black/45 md:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))] transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex h-[72px] items-center gap-3 px-5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-primary text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-[17px] tracking-wide">DHA</strong>
            <small className="text-[11px] text-slate-400 mt-1">Digital Assessment</small>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-[hsl(var(--sidebar-accent))] md:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 grid gap-1" aria-label="Primary navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] transition-colors",
                "hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                pathname.startsWith(href) &&
                  "bg-[hsl(var(--sidebar-accent))] text-white shadow-[inset_3px_0_0_#60a5fa]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {workspaceNavigation.length > 0 && (
            <>
              <Separator className="my-2 bg-[hsl(var(--sidebar-border))]" />
              {workspaceNavigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-[42px] items-center gap-3 rounded-md px-3 text-sm text-[hsl(var(--sidebar-foreground))] transition-colors",
                    "hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                    pathname === href &&
                      "bg-[hsl(var(--sidebar-accent))] text-white shadow-[inset_3px_0_0_#60a5fa]",
                  )}
                >
                  <Icon />
                  {label}
                </Link>
              ))}
            </>
          )}
          {user?.role === "admin" && (
            <>
              <Link
                to="/admin/users"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] transition-colors",
                  "hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                  pathname.startsWith("/admin/users") &&
                    "bg-[hsl(var(--sidebar-accent))] text-white shadow-[inset_3px_0_0_#60a5fa]",
                )}
              >
                <Users className="h-4 w-4" />
                Admin users
              </Link>
              <Link
                to="/admin/methodologies"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] transition-colors",
                  "hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                  pathname.startsWith("/admin/methodologies") &&
                    "bg-[hsl(var(--sidebar-accent))] text-white shadow-[inset_3px_0_0_#60a5fa]",
                )}
              >
                <ClipboardList className="h-4 w-4" />
                Methodologies
              </Link>
              <Link
                to="/admin/tools"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] transition-colors",
                  "hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                  pathname.startsWith("/admin/tools") &&
                    "bg-[hsl(var(--sidebar-accent))] text-white shadow-[inset_3px_0_0_#60a5fa]",
                )}
              >
                <Wrench className="h-4 w-4" />
                Admin tools
              </Link>
              <Link
                to="/admin/permissions"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] transition-colors",
                  "hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                  pathname.startsWith("/admin/permissions") &&
                    "bg-[hsl(var(--sidebar-accent))] text-white shadow-[inset_3px_0_0_#60a5fa]",
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Permissions
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <Separator className="bg-[hsl(var(--sidebar-border))]" />
        <div className="p-3 flex flex-col gap-1">
          <Link
            to="/settings/profile"
            className="flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white transition-colors"
          >
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
          <Link
            to="/settings/security"
            className="flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            Security
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 min-h-[42px] px-3 rounded-md text-sm text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white transition-colors w-full text-left cursor-pointer border-0 bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content column */}
      <div className="flex-1 flex flex-col md:ml-[244px] min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-7">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Digital Assessment Platform
              </span>
              <strong className="text-base leading-none">{title}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WorkspaceSwitcher />
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(user?.display_name || user?.email || "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col">
                <strong className="text-sm leading-none">
                  {user?.display_name || user?.username || "Account"}
                </strong>
                <small className="text-[11px] text-muted-foreground capitalize mt-0.5">
                  {user?.role || "Loading session"}
                </small>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-7 max-w-[1600px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
