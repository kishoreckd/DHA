import { LoaderCircle, Play } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardGridSkeleton, ErrorState, PageHeader, PickerListSkeleton } from "@/components/common/product-ui";
import { useDiscoveredPages } from "@/features/discovery/hooks";
import { ToolCatalog } from "@/features/tools/components/ToolCatalog";
import { useCreateToolBatch, useToolCatalog } from "@/features/tools/hooks";
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

export function ToolsCatalogPage() {
  const { workspaceId = "" } = useParams();
  const catalogQuery = useToolCatalog(workspaceId);
  const pagesQuery = useDiscoveredPages(workspaceId, undefined, "included");
  const createBatch = useCreateToolBatch(workspaceId);
  const [toolKeys, setToolKeys] = useState<string[]>([]);
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [batchName, setBatchName] = useState("Initial CWV Run");
  const [scopeId, setScopeId] = useState("");
  const [outputFormat, setOutputFormat] = useState<"html" | "json" | "screenshot">("html");
  const [uploadToSharepoint, setUploadToSharepoint] = useState(false);
  const [includeRaw, setIncludeRaw] = useState(false);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function submitBatch() {
    const batch = await createBatch.mutateAsync({
      scope_id: scopeId || undefined,
      tool_keys: toolKeys,
      page_ids: pageIds,
      name: batchName,
      output_format: outputFormat,
      upload_to_sharepoint: uploadToSharepoint,
      include_raw: includeRaw,
    });
    appToast.info(`Tool batch ${batch.status}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="Tool catalog"
        actions={
          <Button asChild variant="outline">
            <Link to={`/workspaces/${workspaceId}/tool-runs`}>Run history</Link>
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          {catalogQuery.isLoading && <CardGridSkeleton count={4} />}
          {catalogQuery.isError && <ErrorState message="Unable to load tool catalog." />}
          {catalogQuery.data && <ToolCatalog tools={catalogQuery.data} />}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Batch run</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <section className="grid gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="batch-name">Batch name</Label>
                <Input id="batch-name" value={batchName} onChange={(event) => setBatchName(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scope-id">Scope ID</Label>
                <Input id="scope-id" value={scopeId} onChange={(event) => setScopeId(event.target.value)} placeholder="Optional assessment scope id" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Output format</Label>
                <Select value={outputFormat} onValueChange={(value: "html" | "json" | "screenshot") => setOutputFormat(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="html">html</SelectItem>
                      <SelectItem value="json">json</SelectItem>
                      <SelectItem value="screenshot">screenshot</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={uploadToSharepoint} onChange={(event) => setUploadToSharepoint(event.target.checked)} />
                Upload to SharePoint
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeRaw} onChange={(event) => setIncludeRaw(event.target.checked)} />
                Include raw response
              </label>
            </section>
            <section className="flex flex-col gap-2">
              <strong className="text-sm">Tools</strong>
              <div className="max-h-56 overflow-auto rounded-md border">
                {catalogQuery.isLoading && <PickerListSkeleton />}
                {catalogQuery.data?.map((tool) => (
                  <label key={tool.key} className="flex cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0">
                    <input
                      type="checkbox"
                      checked={toolKeys.includes(tool.key)}
                      onChange={() => toggle(toolKeys, tool.key, setToolKeys)}
                    />
                    {tool.name}
                  </label>
                ))}
              </div>
            </section>
            <section className="flex flex-col gap-2">
              <strong className="text-sm">Pages</strong>
              <div className="max-h-56 overflow-auto rounded-md border">
                {pagesQuery.isLoading && <PickerListSkeleton />}
                {pagesQuery.data?.filter((page) => page.selected_for_assessment).map((page) => (
                  <label key={page.id} className="flex cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0">
                    <input
                      type="checkbox"
                      checked={pageIds.includes(page.id)}
                      onChange={() => toggle(pageIds, page.id, setPageIds)}
                    />
                    <span className="truncate">{page.title || page.canonical_url}</span>
                  </label>
                ))}
              </div>
            </section>
            <Button disabled={createBatch.isPending || toolKeys.length === 0 || pageIds.length === 0} onClick={submitBatch}>
              {createBatch.isPending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Play data-icon="inline-start" />}
              Queue batch
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
