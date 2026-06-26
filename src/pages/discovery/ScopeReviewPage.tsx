import { useMemo } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import { useApproveScope, useCompetitors, useDiscoveredPages } from "@/features/discovery/hooks";

export function ScopeReviewPage() {
  const { workspaceId = "" } = useParams();
  const pagesQuery = useDiscoveredPages(workspaceId);
  const competitorsQuery = useCompetitors(workspaceId);
  const approveScope = useApproveScope(workspaceId);
  const selectedPages = useMemo(
    () => (pagesQuery.data ?? []).filter((page) => page.selected_for_assessment),
    [pagesQuery.data],
  );
  const approvedCompetitors = useMemo(
    () => (competitorsQuery.data ?? []).filter((competitor) => competitor.status === "approved"),
    [competitorsQuery.data],
  );

  async function approve() {
    const scope = await approveScope.mutateAsync({
      property_page_ids: selectedPages.map((page) => page.id),
      competitor_page_ids: [],
    });
    appToast.success(`Scope version ${scope.version_number} approved`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Assessment scope"
        title="Review and approve scope"
        actions={
          <Button disabled={approveScope.isPending || selectedPages.length === 0} onClick={approve}>
            {approveScope.isPending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
            Approve scope
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Selected pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pagesQuery.isLoading && <ListRowsSkeleton actions={false} />}
            {pagesQuery.isError && <ErrorState message="Unable to load selected pages." />}
            <div className="flex flex-col gap-2">
              {selectedPages.map((page) => (
                <div key={page.id} className="rounded-md border px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate">{page.title || page.canonical_url}</strong>
                    <Badge variant="info">{page.page_type}</Badge>
                  </div>
                  <p className="mt-1 truncate text-muted-foreground">{page.canonical_url}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved competitors</CardTitle>
          </CardHeader>
          <CardContent>
            {competitorsQuery.isLoading && <ListRowsSkeleton actions={false} />}
            {competitorsQuery.isError && <ErrorState message="Unable to load competitors." />}
            <div className="flex flex-col gap-2">
              {approvedCompetitors.map((competitor) => (
                <div key={competitor.id} className="rounded-md border px-4 py-3 text-sm">
                  <strong className="block truncate">{competitor.name}</strong>
                  <span className="block truncate text-muted-foreground">{competitor.url}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
