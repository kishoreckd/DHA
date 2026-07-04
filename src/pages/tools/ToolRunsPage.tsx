import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, PageHeader, TableSkeleton } from "@/components/common/product-ui";
import { ToolRunTable } from "@/features/tools/components/ToolRunTable";
import { useToolBatches, useToolRuns } from "@/features/tools/hooks";

export function ToolRunsPage() {
  const { workspaceId = "" } = useParams();
  const [batchId, setBatchId] = useState("all");
  const batchesQuery = useToolBatches(workspaceId);
  const runsQuery = useToolRuns(workspaceId, batchId);

  return (
    <>
      <PageHeader
        eyebrow="Tool jobs"
        title="Run history"
        actions={
          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger className="w-[260px]" aria-label="Filter by batch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All batches</SelectItem>
                {batchesQuery.data?.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name || batch.id}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runsQuery.isLoading && <TableSkeleton columns={7} />}
          {runsQuery.isError && <ErrorState message="Unable to load tool runs." retry={() => void runsQuery.refetch()} />}
          {runsQuery.data && <ToolRunTable runs={runsQuery.data} workspaceId={workspaceId} />}
        </CardContent>
      </Card>
    </>
  );
}
