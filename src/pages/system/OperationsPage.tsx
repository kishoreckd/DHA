import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw, Trash2 } from "lucide-react";
import { appToast } from "@/lib/toast";
import { operationsApi } from "@/lib/api/collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatusBadge } from "@/components/common/product-ui";
import { JsonBlock } from "@/components/common/api-panels";

export function OperationsPage() {
  const readinessQuery = useQuery({ queryKey: ["operations", "ready"], queryFn: operationsApi.readiness });
  const statusQuery = useQuery({ queryKey: ["operations", "status"], queryFn: operationsApi.status });
  const cleanup = useMutation({
    mutationFn: (dryRun: boolean) => operationsApi.cleanupArtifacts(dryRun),
    onSuccess: () => appToast.success("Artifact cleanup request completed"),
  });

  return (
    <>
      <PageHeader
        eyebrow="Operations and hardening"
        title="Operations status"
        description="Readiness, operational state, and artifact cleanup controls from the Postman collection."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void readinessQuery.refetch();
              void statusQuery.refetch();
            }}
          >
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity />
              Readiness
            </CardTitle>
            <CardDescription>GET /ready through the authenticated gateway.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatusBadge value={readinessQuery.isError ? "failed" : readinessQuery.isLoading ? "checking" : "ready"} />
            <JsonBlock value={readinessQuery.data} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations status</CardTitle>
            <CardDescription>GET /admin/operations/status.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatusBadge value={statusQuery.isError ? "failed" : statusQuery.isLoading ? "checking" : "active"} />
            <JsonBlock value={statusQuery.data} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 />
              Artifact cleanup
            </CardTitle>
            <CardDescription>POST /admin/operations/artifacts/cleanup with dry-run and live modes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => cleanup.mutate(true)} disabled={cleanup.isPending}>
                Dry run
              </Button>
              <Button variant="destructive" onClick={() => cleanup.mutate(false)} disabled={cleanup.isPending}>
                Cleanup artifacts
              </Button>
            </div>
            <JsonBlock value={cleanup.data} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
