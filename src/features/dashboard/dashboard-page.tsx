import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, Play, ShieldCheck, UserRound, Users } from "lucide-react";
import { PageHeader } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS OVERVIEW"
        title={`Welcome${user?.first_name ? `, ${user.first_name}` : ""}`}
        description="Run the currently available assessment tools and manage your account."
        actions={
          <Button asChild>
            <Link to="/tools/sync">
              <Play />
              Start tool sync
            </Link>
          </Button>
        }
      />

      {/* Metric row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5" aria-label="Available API capabilities">
        {[
          { icon: Play, label: "Assessment tools", value: "12 crawler APIs", note: "Run one or more tools against a target URL" },
          { icon: UserRound, label: "Account", value: user?.role || "User", note: "Profile and password APIs are available" },
          { icon: ShieldCheck, label: "Session security", value: "HTTP-only cookie", note: "Tokens stay outside browser JavaScript" },
          ...(user?.role === "admin"
            ? [{ icon: Users, label: "Administration", value: "User APIs", note: "Users, invitations, roles, and audit logs" }]
            : []),
        ].map(({ icon: Icon, label, value, note }) => (
          <div
            key={label}
            className="flex gap-3 rounded-lg border border-border bg-card p-4 min-h-[126px] shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <small className="text-muted-foreground font-semibold text-xs">{label}</small>
              <strong className="text-xl leading-none">{value}</strong>
              <p className="text-muted-foreground text-xs leading-relaxed m-0">{note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_.9fr] gap-4.5 gap-y-4">
        {/* Workflow steps — spans 2 cols */}
        <Card className="md:col-span-2">
          <CardHeader>
            <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
              AVAILABLE NOW
            </span>
            <CardTitle>Assessment tool synchronization</CardTitle>
            <CardDescription>
              Use the crawler endpoints currently provided by the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ["01", "Enter a website", "Provide one complete target URL for the assessment."],
                ["02", "Select tools", "Choose from the crawler services supported by the backend."],
                ["03", "Run securely", "Next.js attaches the server-only crawler API key."],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="flex gap-3 rounded-md border border-border bg-muted/40 p-3.5"
                >
                  <b className="text-primary text-xs shrink-0">{number}</b>
                  <span>
                    <strong className="block text-sm mb-1">{title}</strong>
                    <p className="text-xs text-muted-foreground leading-snug m-0">{description}</p>
                  </span>
                </div>
              ))}
            </div>
            <Link
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:underline"
              to="/tools/sync"
            >
              Configure tool synchronization <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Account links */}
        <Card>
          <CardHeader>
            <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
              ACCOUNT
            </span>
            <CardTitle>Account settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {[
              { href: "/settings/profile", icon: UserRound, label: "Update profile", note: "Username, name, and profile image" },
              { href: "/settings/security", icon: KeyRound, label: "Change password", note: "End the current session after updating" },
              ...(user?.role === "admin"
                ? [{ href: "/admin/users", icon: Users, label: "Manage users", note: "Invitations, roles, status, and logs" }]
                : []),
            ].map(({ href, icon: Icon, label, note }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-2.5 py-3.5 hover:text-primary transition-colors"
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <strong className="text-sm leading-none">{label}</strong>
                  <small className="text-muted-foreground text-xs">{note}</small>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Connection note — full width */}
        <Card className="md:col-span-3 border-l-[3px] border-l-primary flex flex-row items-center justify-between gap-8 p-5">
          <div>
            <strong className="text-sm">Only backend-supported features are enabled</strong>
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
              Authentication, profile management, user administration, audit logs, and crawler
              requests are connected through server-side route handlers.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link to="/tools/sync">Open tool sync</Link>
          </Button>
        </Card>
      </div>
    </>
  );
}
