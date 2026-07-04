import { useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import {
  useCompetitors,
  useCreateCompetitor,
  useProperties,
  useSuggestCompetitors,
  useUpdateCompetitor,
} from "@/features/discovery/hooks";

export function CompetitorsPage() {
  const { workspaceId = "" } = useParams();
  const propertiesQuery = useProperties(workspaceId);
  const [propertyId, setPropertyId] = useState("");
  const activePropertyId = propertyId || propertiesQuery.data?.[0]?.id || "";
  const competitorsQuery = useCompetitors(workspaceId, activePropertyId || undefined);
  const createCompetitor = useCreateCompetitor(workspaceId);
  const suggestCompetitors = useSuggestCompetitors(workspaceId);
  const updateCompetitor = useUpdateCompetitor(workspaceId);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createCompetitor.mutateAsync({ name, url, property_id: activePropertyId });
    setName("");
    setUrl("");
    appToast.success("Competitor added");
  }

  async function setStatus(id: string, status: "approved" | "rejected") {
    await updateCompetitor.mutateAsync({ id, input: { status } });
    appToast.success(status === "approved" ? "Competitor approved" : "Competitor rejected");
  }

  async function suggest() {
    await suggestCompetitors.mutateAsync({ property_id: activePropertyId });
    appToast.info("Competitor suggestion request sent");
  }

  return (
    <>
      <PageHeader
        eyebrow="Competitors"
        title="Competitor review"
        actions={
          <Button variant="outline" onClick={suggest} disabled={!activePropertyId || suggestCompetitors.isPending}>
            {suggestCompetitors.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
            Suggest competitors
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add competitor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="competitor-name">Name</Label>
                <Input id="competitor-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="competitor-url">URL</Label>
                <Input
                  id="competitor-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-fit" disabled={createCompetitor.isPending || !activePropertyId || !name || !url}>
                {createCompetitor.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
                Add competitor
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            {competitorsQuery.isLoading && <ListRowsSkeleton />}
            {competitorsQuery.isError && <ErrorState message="Unable to load competitors." />}
            <div className="flex flex-col gap-2">
              {competitorsQuery.data?.map((competitor) => (
                <div key={competitor.id} className="flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <strong className="block truncate">{competitor.name}</strong>
                    <span className="block truncate text-sm text-muted-foreground">{competitor.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={competitor.status === "approved" ? "success" : competitor.status === "rejected" ? "destructive" : "warning"}>
                      {competitor.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setStatus(competitor.id, "approved")}>
                      <Plus data-icon="inline-start" />
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(competitor.id, "rejected")}>
                      Reject
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
