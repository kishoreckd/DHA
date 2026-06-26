import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Page Header ────────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        {eyebrow && (
          <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-1 mb-1.5 text-[clamp(25px,3vw,34px)] font-bold tracking-tight leading-none">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
      </div>
      {actions && <div className="flex gap-2 items-center shrink-0">{actions}</div>}
    </header>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

const statusVariantMap: Record<string, "success" | "destructive" | "info" | "warning" | "default"> = {
  active: "success",
  completed: "success",
  approved: "success",
  published: "success",
  ready: "success",
  user: "success",
  failed: "destructive",
  disabled: "destructive",
  high: "destructive",
  running: "info",
  admin: "info",
  in_review: "info",
  queued: "warning",
  invited: "warning",
  awaiting_sync: "warning",
  draft: "warning",
  medium: "warning",
};

export function StatusBadge({ value }: { value: string }) {
  const key = value.toLowerCase().replaceAll(" ", "_");
  const variant = statusVariantMap[key] ?? "default";

  const colorCn: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700",
    destructive: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    warning: "bg-amber-50 text-amber-700",
    default: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap",
        colorCn[variant],
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center text-center text-muted-foreground px-6 py-10 gap-2">
      <span className="text-slate-400 mb-1">{icon}</span>
      <h3 className="text-foreground font-semibold text-sm">{title}</h3>
      <p className="max-w-md text-xs leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

// ─── Loading State ───────────────────────────────────────────────────────────

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[140px] items-center justify-center gap-2.5 text-sm text-muted-foreground" role="status">
      <span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />
      {label}
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm"
      role="alert"
    >
      <strong className="block font-semibold text-red-700">Something went wrong</strong>
      <p className="mt-1 text-red-600">{message}</p>
      {retry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
