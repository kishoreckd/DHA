import { Badge } from "@/components/ui/badge";
import type { ToolRunStatus } from "../types";

export function ToolRunStatusBadge({ status }: { status: ToolRunStatus }) {
  const variant =
    status === "completed"
      ? "success"
      : status === "failed" || status === "cancelled"
        ? "destructive"
        : status === "partial" || status === "stale"
          ? "warning"
          : "info";

  return <Badge variant={variant}>{status}</Badge>;
}
