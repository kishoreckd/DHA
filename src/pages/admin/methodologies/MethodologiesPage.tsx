import { Copy, Plus } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState, PageHeader } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { MethodologyStatusBadge } from "@/features/methodologies/components/MethodologyStatusBadge";
import { useCloneMethodology, useMethodologies } from "@/features/methodologies/hooks";

export function MethodologiesPage() {
  const { user } = useAuth();
  const methodologiesQuery = useMethodologies();
  const cloneMethodology = useCloneMethodology();
  const canManage = user?.role === "admin" || user?.permissions.includes("methodology.manage");

  if (!canManage) return <Navigate to="/dashboard" replace />;

  async function clone(id: string) {
    const methodology = await cloneMethodology.mutateAsync(id);
    toast.success(`Draft version ${methodology.version_number} created`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Methodologies"
        actions={
          <Button asChild>
            <Link to="/admin/methodologies/new">
              <Plus data-icon="inline-start" />
              New methodology
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {methodologiesQuery.isLoading && <LoadingState label="Loading methodologies..." />}
          {methodologiesQuery.isError && <ErrorState message="Unable to load methodologies." />}
          <div className="flex flex-col gap-2">
            {methodologiesQuery.data?.map((methodology) => (
              <div key={methodology.id} className="flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link to={`/admin/methodologies/${methodology.id}`} className="min-w-0 hover:underline">
                  <strong className="block truncate">{methodology.name}</strong>
                  <span className="text-sm text-muted-foreground">Version {methodology.version_number}</span>
                </Link>
                <div className="flex items-center gap-2">
                  <MethodologyStatusBadge status={methodology.status} />
                  <Button variant="outline" size="sm" onClick={() => clone(methodology.id)}>
                    <Copy data-icon="inline-start" />
                    Clone
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
