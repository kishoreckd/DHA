import { useMemo, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import {
  useApproveExistingScope,
  useApproveScope,
  useCompetitors,
  useCreateScope,
  useDiscoveredPages,
  useProperties,
  useScopes,
  useSubmitScope,
} from "@/features/discovery/hooks";

export function ScopeReviewPage() {
  const { workspaceId = "" } = useParams();
  const propertiesQuery = useProperties(workspaceId);
  const activePropertyId = propertiesQuery.data?.[0]?.id ?? "";
  const pagesQuery = useDiscoveredPages(workspaceId, activePropertyId || undefined, "included");
  const competitorsQuery = useCompetitors(workspaceId, activePropertyId || undefined);
  const approveScope = useApproveScope(workspaceId);
  const scopesQuery = useScopes(workspaceId, activePropertyId || undefined);
  const createScope = useCreateScope(workspaceId);
  const submitScope = useSubmitScope(workspaceId);
  const approveExistingScope = useApproveExistingScope(workspaceId);
  const [notes, setNotes] = useState("Initial scope for assessment.");
  const selectedPages = useMemo(
    () => (pagesQuery.data ?? []).filter((page) => page.selected_for_assessment),
    [pagesQuery.data],
  );
  const approvedCompetitors = useMemo(
    () => (competitorsQuery.data ?? []).filter((competitor) => competitor.status === "approved"),
    [competitorsQuery.data],
  );

  async function approve() {
    const scope = await approveScope.mutateAsync({ property_id: activePropertyId });
    appToast.success(`Scope version ${scope.version_number} approved`);
  }

  async function createDraft() {
    await createScope.mutateAsync({ property_id: activePropertyId, notes });
    appToast.success("Scope draft created");
  }

  async function submitDraft(scopeId: string) {
    await submitScope.mutateAsync({ scopeId, notes: "Ready for approval." });
    appToast.success("Scope submitted");
  }

  async function approveDraft(scopeId: string) {
    await approveExistingScope.mutateAsync({ scopeId, notes: "Approved." });
    appToast.success("Scope approved");
  }

  return (
    <>
      <PageHeader
        eyebrow="Assessment scope"
        title="Review and approve scope"
        actions={
          <Button disabled={approveScope.isPending || !activePropertyId || selectedPages.length === 0} onClick={approve}>
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assessment scope APIs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <textarea
              className="min-h-24 rounded-md border bg-background p-3 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Scope notes"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={createDraft} disabled={!activePropertyId || createScope.isPending}>
                {createScope.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
                Create scope draft
              </Button>
            </div>
            {scopesQuery.isLoading && <ListRowsSkeleton actions />}
            {scopesQuery.isError && <ErrorState message="Unable to load assessment scopes." />}
            <div className="flex flex-col gap-2">
              {scopesQuery.data?.map((scope) => (
                <div key={scope.id} className="flex flex-col gap-3 rounded-md border px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 text-sm">
                    <strong>Version {scope.version_number}</strong>
                    <span className="ml-2 text-muted-foreground">{scope.status}</span>
                    <p className="truncate text-muted-foreground">{scope.notes || "No notes"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => submitDraft(scope.id)} disabled={submitScope.isPending}>
                      Submit
                    </Button>
                    <Button size="sm" onClick={() => approveDraft(scope.id)} disabled={approveExistingScope.isPending}>
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
