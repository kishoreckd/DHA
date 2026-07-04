import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./product-ui";

export function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[420px] overflow-auto rounded-md bg-muted p-3 text-xs">
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}

export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function ActionCard({
  title,
  description,
  children,
  action,
  pending,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  action?: { label: string; onClick: () => void };
  pending?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
        {action && (
          <Button onClick={action.onClick} disabled={pending}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function DataRow({
  title,
  detail,
  status,
  action,
}: {
  title: string;
  detail?: string;
  status?: string | null;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="min-w-0">
        <strong className="block truncate text-sm">{title}</strong>
        {detail && <small className="block truncate text-muted-foreground">{detail}</small>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {status && <StatusBadge value={status} />}
        {action}
      </span>
    </div>
  );
}
