import { RotateCcw } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState, PageHeader } from "@/components/common/product-ui";
import { ToolRunArtifacts } from "@/features/tools/components/ToolRunArtifacts";
import { ToolRunStatusBadge } from "@/features/tools/components/ToolRunStatusBadge";
import { ToolRunTimeline } from "@/features/tools/components/ToolRunTimeline";
import { useArtifactUrl, useRetryToolRun, useToolRun, useToolRunMeasurements } from "@/features/tools/hooks";

export function ToolRunDetailPage() {
  const { workspaceId = "", runId = "" } = useParams();
  const runQuery = useToolRun(workspaceId, runId);
  const measurementsQuery = useToolRunMeasurements(workspaceId, runId);
  const retryRun = useRetryToolRun(workspaceId);
  const artifactUrl = useArtifactUrl(workspaceId, runId);

  async function retry() {
    await retryRun.mutateAsync(runId);
    toast.success("Tool run retry queued");
  }

  async function openArtifact(artifactId: string) {
    const result = await artifactUrl.mutateAsync(artifactId);
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  if (runQuery.isLoading) return <LoadingState label="Loading tool run..." />;
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
              <ToolRunArtifacts artifacts={runQuery.data.artifacts ?? []} onOpen={openArtifact} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Extracted measurements</CardTitle>
            </CardHeader>
            <CardContent>
              {measurementsQuery.isLoading && <LoadingState label="Loading measurements..." />}
              <div className="grid gap-2 sm:grid-cols-2">
                {(measurementsQuery.data ?? runQuery.data.measurements ?? []).map((measurement) => (
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
