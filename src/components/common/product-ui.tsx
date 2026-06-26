import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Page Header ────────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
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
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
        )}
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
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center text-center text-muted-foreground px-6 py-10 gap-2">
      <span className="text-slate-400 mb-1">{icon}</span>
      <h3 className="text-foreground font-semibold text-sm">{title}</h3>
      {description && <p className="max-w-md text-xs leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}

// ─── Loading State ───────────────────────────────────────────────────────────

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[140px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader variant="dots-pulse" size="lg" />
      <span className="font-semibold tracking-wide text-foreground">{label}</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <CardGridSkeleton />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-5">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({ rows = 5, actions = true }: { rows?: number; actions?: boolean }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="flex max-w-2xl flex-col gap-4" aria-hidden="true">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

export function DetailSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-card p-5">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PickerListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="max-h-56 overflow-hidden rounded-md border" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function BadgeListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-7 w-24 rounded-md" />
      ))}
    </div>
  );
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-md border px-4 py-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 7, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card" aria-hidden="true">
      <div className="grid gap-3 border-b bg-muted/40 p-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3 p-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton key={columnIndex} className={cn("h-4", columnIndex === 0 ? "w-28" : "w-full")} />
            ))}
          </div>
        ))}
      </div>
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
