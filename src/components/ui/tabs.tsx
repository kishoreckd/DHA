import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-md border bg-card p-1", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "h-8 rounded px-3 text-sm font-medium text-muted-foreground transition-colors",
            value === item.value && "bg-primary text-primary-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
