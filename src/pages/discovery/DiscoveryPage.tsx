import { useMemo, useState } from "react";
import { LoaderCircle, Plus, Search } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, PageHeader, TableSkeleton } from "@/components/common/product-ui";
import {
  useAddManualPage,
  useDiscoveredPages,
  useDiscoveryJob,
  useProperties,
  useStartDiscoveryJob,
  useUpdateDiscoveredPage,
} from "@/features/discovery/hooks";
import type { DiscoveredPage, PageType } from "@/features/discovery/types";

const pageTypes: PageType[] = ["homepage", "pdp", "plp", "landing", "article", "other"];

export function DiscoveryPage() {
  const { workspaceId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") ?? "";
  const propertiesQuery = useProperties(workspaceId);
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [jobId, setJobId] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [selectedPage, setSelectedPage] = useState<DiscoveredPage | null>(null);
  const pagesQuery = useDiscoveredPages(workspaceId, propertyId || undefined);
  const startJob = useStartDiscoveryJob(workspaceId);
  const jobQuery = useDiscoveryJob(workspaceId, jobId);
  const updatePage = useUpdateDiscoveredPage(workspaceId, propertyId || undefined);
  const addManualPage = useAddManualPage(workspaceId, propertyId || undefined);

  const activePropertyId = useMemo(
    () => propertyId || propertiesQuery.data?.[0]?.id || "",
    [propertyId, propertiesQuery.data],
  );

  async function runDiscovery() {
    const job = await startJob.mutateAsync({ property_id: activePropertyId });
    setJobId(job.id);
    appToast.info("Discovery job queued");
  }

  async function submitManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addManualPage.mutateAsync({ property_id: activePropertyId, url: manualUrl, page_type: "other" });
    setManualUrl("");
    appToast.success("Manual page added");
  }

  return (
    <>
      <PageHeader
        eyebrow="Discovery"
        title="Website discovery"
      />
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Discovery job</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Property</Label>
              <Select value={activePropertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {propertiesQuery.data?.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.normalized_domain}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button disabled={!activePropertyId || startJob.isPending} onClick={runDiscovery}>
              {startJob.isPending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Search data-icon="inline-start" />}
              Start discovery
            </Button>
            {jobQuery.data && (
              <div className="rounded-md border px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <strong>Status</strong>
                  <Badge variant={jobQuery.data.status === "failed" ? "destructive" : "info"}>
                    {jobQuery.data.status}
                  </Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${jobQuery.data.progress ?? 0}%` }}
                  />
                </div>
              </div>
            )}
            <form onSubmit={submitManual} className="flex flex-col gap-3">
              <Label htmlFor="manual-url">Manual page URL</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-url"
                  type="url"
                  value={manualUrl}
                  onChange={(event) => setManualUrl(event.target.value)}
                  placeholder="https://example.com/page"
                />
                <Button type="submit" size="icon" disabled={!activePropertyId || !manualUrl.trim()}>
                  <Plus />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Discovered pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pagesQuery.isLoading && <TableSkeleton columns={9} />}
            {pagesQuery.isError && <ErrorState message="Unable to load discovered pages." />}
            {pagesQuery.data && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-semibold">URL</th>
                      <th className="px-3 py-2 font-semibold">Title</th>
                      <th className="px-3 py-2 font-semibold">Canonical URL</th>
                      <th className="px-3 py-2 font-semibold">Page type</th>
                      <th className="px-3 py-2 font-semibold">Source</th>
                      <th className="px-3 py-2 font-semibold">Depth</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Selected</th>
                      <th className="px-3 py-2 font-semibold">Last discovered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagesQuery.data.map((page) => (
                      <tr key={page.id} className="cursor-pointer hover:bg-accent" onClick={() => setSelectedPage(page)}>
                        <td className="max-w-[260px] truncate px-3 py-3">{page.url}</td>
                        <td className="max-w-[180px] truncate px-3 py-3">{page.title || "Untitled"}</td>
                        <td className="max-w-[260px] truncate px-3 py-3 text-muted-foreground">{page.canonical_url}</td>
                        <td className="px-3 py-3">{page.page_type}</td>
                        <td className="px-3 py-3">{page.source}</td>
                        <td className="px-3 py-3">{page.depth}</td>
                        <td className="px-3 py-3">{page.status}</td>
                        <td className="px-3 py-3">{page.selected_for_assessment ? "Yes" : "No"}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {new Date(page.last_discovered_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={Boolean(selectedPage)} onOpenChange={(open) => !open && setSelectedPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classify page</DialogTitle>
            <DialogDescription>{selectedPage?.canonical_url}</DialogDescription>
          </DialogHeader>
          {selectedPage && (
            <div className="flex flex-col gap-4">
              <Select
                value={selectedPage.page_type}
                onValueChange={(pageType: PageType) =>
                  setSelectedPage({ ...selectedPage, page_type: pageType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {pageTypes.map((pageType) => (
                      <SelectItem key={pageType} value={pageType}>
                        {pageType}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                onClick={async () => {
                  await updatePage.mutateAsync({
                    id: selectedPage.id,
                    input: {
                      page_type: selectedPage.page_type,
                      selected_for_assessment: true,
                      status: "selected",
                    },
                  });
                  setSelectedPage(null);
                  appToast.success("Page classification saved");
                }}
              >
                Save classification
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
