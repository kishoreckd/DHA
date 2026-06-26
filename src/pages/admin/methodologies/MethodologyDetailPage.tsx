import { CheckCircle2, ListChecks } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton, ErrorState, PageHeader } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { MethodologyStatusBadge } from "@/features/methodologies/components/MethodologyStatusBadge";
import {
  useMethodology,
  usePublishMethodology,
  useValidateMethodology,
} from "@/features/methodologies/hooks";

export function MethodologyDetailPage() {
  const { user } = useAuth();
  const { methodologyId = "" } = useParams();
  const methodologyQuery = useMethodology(methodologyId);
  const validateMethodology = useValidateMethodology(methodologyId);
  const publishMethodology = usePublishMethodology(methodologyId);
  const canManage = user?.role === "admin" || user?.permissions.includes("methodology.manage");

  if (!canManage) return <Navigate to="/dashboard" replace />;
  if (methodologyQuery.isLoading) return <DetailSkeleton />;
  if (methodologyQuery.isError || !methodologyQuery.data) return <ErrorState message="Methodology unavailable." />;

  const isPublished = methodologyQuery.data.status === "published";

  async function validate() {
    const result = await validateMethodology.mutateAsync();
    if (result.is_valid) {
      appToast.success("Methodology is valid");
    } else {
      appToast.error("Validation failed");
    }
  }

  async function publish() {
    await publishMethodology.mutateAsync();
    appToast.success("Methodology published");
  }

  return (
    <>
      <PageHeader
        eyebrow={`Version ${methodologyQuery.data.version_number}`}
        title={methodologyQuery.data.name}
        actions={
          <>
            <MethodologyStatusBadge status={methodologyQuery.data.status} />
            <Button asChild variant="outline">
              <Link to={`/admin/methodologies/${methodologyId}/metrics`}>
                <ListChecks data-icon="inline-start" />
                Metrics
              </Link>
            </Button>
            <Button variant="outline" onClick={validate}>
              Validate
            </Button>
            {!isPublished && (
              <Button onClick={publish}>
                <CheckCircle2 data-icon="inline-start" />
                Publish
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Version summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Metric count</span>
              <strong className="mt-1 block">{methodologyQuery.data.metric_count ?? 0}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Total weight</span>
              <strong className="mt-1 block">{methodologyQuery.data.total_weight ?? 0}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Locked at</span>
              <strong className="mt-1 block">{methodologyQuery.data.locked_at || "Editable draft"}</strong>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Validation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {validateMethodology.data ? (
              <>
                <strong>Total weight: {validateMethodology.data.total_weight}</strong>
                {validateMethodology.data.errors.map((error) => (
                  <span key={error} className="text-destructive">{error}</span>
                ))}
                {validateMethodology.data.warnings.map((warning) => (
                  <span key={warning} className="text-muted-foreground">{warning}</span>
                ))}
              </>
            ) : (
              <p className="text-muted-foreground">Run validation before publishing a methodology version.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
