import { Badge } from "@/components/ui/badge";
import type { WorkspaceStatus } from "../types";

export function WorkspaceStatusBadge({ status }: { status: WorkspaceStatus }) {
  const variant = status === "active" ? "success" : status === "archived" ? "secondary" : "warning";
  return <Badge variant={variant}>{status}</Badge>;
}
