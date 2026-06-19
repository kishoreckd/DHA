import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  DatabaseZap,
  FileSpreadsheet,
  Gauge,
  Layers3,
  Plus,
  Settings2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/projects", label: "Projects", icon: Layers3 },
  { href: "/projects/lysol/top-pages", label: "Top Pages", icon: ArrowUpRight },
  { href: "/projects/lysol/pillars", label: "Pillars", icon: FileSpreadsheet },
  { href: "/projects/lysol/tools", label: "Tools", icon: Wrench },
  { href: "/projects/lysol/sync", label: "Sync", icon: DatabaseZap },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">DHA Assessment</div>
            <div className="text-xs text-muted-foreground">Client audit workspace</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-secondary text-secondary-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="rounded-lg border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active client</span>
              <Badge variant="success">Baseline</Badge>
            </div>
            <div className="text-sm font-semibold">lysol.com</div>
            <div className="text-xs text-muted-foreground">40 metrics pages mapped</div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:px-6">
          <div className="min-w-0">
            <div className="text-sm font-semibold lg:hidden">DHA Assessment</div>
            <div className="hidden text-sm text-muted-foreground lg:block">
              Project creation, Semrush top pages, pillar metrics, SharePoint sync, and tool automation.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4" />
              API Settings
            </Button>
            <Button size="sm" onClick={() => (window.location.href = "/projects/new")}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
