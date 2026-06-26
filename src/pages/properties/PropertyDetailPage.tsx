import { Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton, ErrorState, PageHeader } from "@/components/common/product-ui";
import { useProperty } from "@/features/discovery/hooks";

export function PropertyDetailPage() {
  const { workspaceId = "", propertyId = "" } = useParams();
  const propertyQuery = useProperty(workspaceId, propertyId);

  if (propertyQuery.isLoading) return <DetailSkeleton cards={1} />;
  if (propertyQuery.isError || !propertyQuery.data) return <ErrorState message="Property unavailable." />;

  return (
    <>
      <PageHeader
        eyebrow="Property"
        title={propertyQuery.data.name || propertyQuery.data.normalized_domain}
        actions={
          <Button asChild>
            <Link to={`/workspaces/${workspaceId}/discovery?propertyId=${propertyId}`}>
              <Search data-icon="inline-start" />
              Run discovery
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Website profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Domain</span>
            <strong className="mt-1 block">{propertyQuery.data.normalized_domain}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="mt-1">
              <Badge variant="success">{propertyQuery.data.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
