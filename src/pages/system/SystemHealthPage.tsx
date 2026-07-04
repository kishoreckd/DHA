import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, PageHeader, StatusBadge } from "@/components/common/product-ui";
import { systemApi } from "@/lib/api/system";

export function SystemHealthPage() {
  const healthQuery = useQuery({
    queryKey: ["system", "health"],
    queryFn: systemApi.health,
  });

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Backend health"
        description="Checks the FastAPI /health endpoint through the frontend proxy."
        actions={
          <Button variant="outline" onClick={() => void healthQuery.refetch()}>
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        }
      />
      {healthQuery.isError && <ErrorState message="Backend health check failed." retry={() => void healthQuery.refetch()} />}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health response
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatusBadge value={healthQuery.isLoading ? "checking" : healthQuery.isError ? "failed" : "active"} />
          <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(healthQuery.data ?? null, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </>
  );
}
