import { Badge } from "@/components/ui/badge";
import type { MethodologyStatus } from "../types";

export function MethodologyStatusBadge({ status }: { status: MethodologyStatus }) {
  const variant =
    status === "published" || status === "approved"
      ? "success"
      : status === "superseded"
        ? "secondary"
        : status === "in_review"
          ? "info"
          : "warning";

  return <Badge variant={variant}>{status}</Badge>;
}
