import { Ban, RotateCcw } from "lucide-react";
import { useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton, ErrorState, PageHeader } from "@/components/common/product-ui";
import { ToolRunArtifacts } from "@/features/tools/components/ToolRunArtifacts";
import { ToolRunStatusBadge } from "@/features/tools/components/ToolRunStatusBadge";
import { ToolRunTimeline } from "@/features/tools/components/ToolRunTimeline";
import { useCancelToolRun, useRetryToolRun, useToolRun } from "@/features/tools/hooks";

export function ToolRunDetailPage() {
  const { workspaceId = "", runId = "" } = useParams();
  const runQuery = useToolRun(workspaceId, runId);
  const retryRun = useRetryToolRun(workspaceId);
  const cancelRun = useCancelToolRun(workspaceId);

  async function retry() {
    await retryRun.mutateAsync(runId);
    appToast.info("Tool run retry queued");
  }

  async function cancel() {
    await cancelRun.mutateAsync(runId);
    appToast.info("Tool run cancelled");
  }

  if (runQuery.isLoading) return <DetailSkeleton />;
  if (runQuery.isError || !runQuery.data) return <ErrorState message="Tool run unavailable." />;

  return (
    <>
      <PageHeader
        eyebrow="Tool run"
        title={runQuery.data.tool_name || runQuery.data.tool_key}
        actions={
          <>
            <ToolRunStatusBadge status={runQuery.data.status} />
            {["failed", "stale", "partial"].includes(runQuery.data.status) && (
              <Button variant="outline" onClick={retry} disabled={retryRun.isPending}>
                <RotateCcw data-icon="inline-start" />
                Retry
              </Button>
            )}
            {["queued", "running"].includes(runQuery.data.status) && (
              <Button variant="outline" onClick={cancel} disabled={cancelRun.isPending}>
                <Ban data-icon="inline-start" />
                Cancel
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ToolRunTimeline run={runQuery.data} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
            </CardHeader>
            <CardContent>
              <ToolRunArtifacts workspaceId={workspaceId} artifacts={runQuery.data.artifacts ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Extracted measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {(runQuery.data.measurements ?? []).map((measurement) => (
                  <div key={measurement.id} className="rounded-md border px-4 py-3 text-sm">
                    <strong>{measurement.label}</strong>
                    <span className="mt-1 block text-muted-foreground">
                      {String(measurement.value)} {measurement.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
