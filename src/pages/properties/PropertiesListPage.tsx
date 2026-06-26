import { useState } from "react";
import { Globe2, LoaderCircle, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailSkeleton, EmptyState, ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import { WorkspaceHeader } from "@/features/workspaces/components/WorkspaceHeader";
import { useWorkspace } from "@/features/workspaces/hooks";
import { useCreateProperty, useProperties } from "@/features/discovery/hooks";

export function PropertiesListPage() {
  const { workspaceId = "" } = useParams();
  const navigate = useNavigate();
  const workspaceQuery = useWorkspace(workspaceId);
  const propertiesQuery = useProperties(workspaceId);
  const createProperty = useCreateProperty(workspaceId);
  const [url, setUrl] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const property = await createProperty.mutateAsync({ url });
    setUrl("");
    appToast.success("Property saved");
    await propertiesQuery.refetch();
    navigate(`/workspaces/${workspaceId}/properties/${property.id}`);
  }

  if (workspaceQuery.isLoading) return <DetailSkeleton cards={1} />;
  if (workspaceQuery.isError || !workspaceQuery.data) return <ErrorState message="Workspace unavailable." />;

  return (
    <>
      <WorkspaceHeader workspace={workspaceQuery.data} />
      <PageHeader
        eyebrow="Website intake"
        title="Properties"
      />
      <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add website</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="property-url">Website URL</Label>
                <Input
                  id="property-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-fit" disabled={createProperty.isPending || !url.trim()}>
                {createProperty.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
                Save property
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saved properties</CardTitle>
          </CardHeader>
          <CardContent>
            {propertiesQuery.isLoading && <ListRowsSkeleton actions={false} />}
            {propertiesQuery.isError && <ErrorState message="Unable to load properties." />}
            {propertiesQuery.data?.length === 0 && (
              <EmptyState
                icon={<Globe2 />}
                title="No properties yet"
              />
            )}
            <div className="flex flex-col gap-2">
              {propertiesQuery.data?.map((property) => (
                <Link
                  key={property.id}
                  to={`/workspaces/${workspaceId}/properties/${property.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm hover:bg-accent"
                >
                  <span className="min-w-0">
                    <strong className="block truncate">{property.name || property.normalized_domain}</strong>
                    <span className="block truncate text-muted-foreground">{property.url}</span>
                  </span>
                  <Plus />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
