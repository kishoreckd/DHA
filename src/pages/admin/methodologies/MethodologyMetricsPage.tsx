import { Navigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton, ErrorState, PageHeader, TableSkeleton } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { MetricRegistryTable } from "@/features/methodologies/components/MetricRegistryTable";
import { MethodologyStatusBadge } from "@/features/methodologies/components/MethodologyStatusBadge";
import { useMethodology, useMethodologyMetrics } from "@/features/methodologies/hooks";

export function MethodologyMetricsPage() {
  const { user } = useAuth();
  const { methodologyId = "" } = useParams();
  const methodologyQuery = useMethodology(methodologyId);
  const metricsQuery = useMethodologyMetrics(methodologyId);
  const canManage = user?.role === "admin" || user?.permissions.includes("methodology.manage");

  if (!canManage) return <Navigate to="/dashboard" replace />;
  if (methodologyQuery.isLoading) return <DetailSkeleton cards={1} />;
  if (methodologyQuery.isError || !methodologyQuery.data) return <ErrorState message="Methodology unavailable." />;

  return (
    <>
      <PageHeader
        eyebrow="Metric registry"
        title={methodologyQuery.data.name}
        actions={<MethodologyStatusBadge status={methodologyQuery.data.status} />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsQuery.isLoading && <TableSkeleton columns={6} />}
          {metricsQuery.isError && <ErrorState message="Unable to load metric definitions." />}
          {metricsQuery.data && <MetricRegistryTable metrics={metricsQuery.data} />}
        </CardContent>
      </Card>
    </>
  );
}
