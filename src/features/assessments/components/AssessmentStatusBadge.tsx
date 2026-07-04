import { Badge } from "@/components/ui/badge";

const variantByStatus: Record<string, "success" | "destructive" | "info" | "warning" | "secondary"> = {
  approved: "success",
  published: "success",
  snapshot_ready: "success",
  scored: "success",
  rejected: "destructive",
  failed: "destructive",
  evidence_review: "info",
  baseline_review: "info",
  report_draft: "info",
  draft: "warning",
  baseline_draft: "warning",
  pending: "warning",
};

export function AssessmentStatusBadge({ status }: { status?: string | null }) {
  const value = status || "draft";
  return <Badge variant={variantByStatus[value] ?? "secondary"}>{value.replaceAll("_", " ")}</Badge>;
}
