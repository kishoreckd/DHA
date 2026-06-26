import { LoaderCircle, Play } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState, PageHeader } from "@/components/common/product-ui";
import { useDiscoveredPages } from "@/features/discovery/hooks";
import { ToolCatalog } from "@/features/tools/components/ToolCatalog";
import { useCreateToolBatch, useToolCatalog } from "@/features/tools/hooks";

export function ToolsCatalogPage() {
  const { workspaceId = "" } = useParams();
  const catalogQuery = useToolCatalog(workspaceId);
  const pagesQuery = useDiscoveredPages(workspaceId);
  const createBatch = useCreateToolBatch(workspaceId);
  const [toolKeys, setToolKeys] = useState<string[]>([]);
  const [pageIds, setPageIds] = useState<string[]>([]);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function submitBatch() {
    const batch = await createBatch.mutateAsync({ tool_keys: toolKeys, page_ids: pageIds });
    toast.success(`Tool batch ${batch.status}`);
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
          {catalogQuery.isLoading && <LoadingState label="Loading tool catalog..." />}
          {catalogQuery.isError && <ErrorState message="Unable to load tool catalog." />}
          {catalogQuery.data && <ToolCatalog tools={catalogQuery.data} />}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Batch run</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <strong className="text-sm">Tools</strong>
              <div className="max-h-56 overflow-auto rounded-md border">
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
