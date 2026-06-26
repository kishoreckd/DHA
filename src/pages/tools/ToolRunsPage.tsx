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
import { useToolRuns } from "@/features/tools/hooks";

const statuses = ["all", "queued", "running", "completed", "partial", "failed", "cancelled", "stale"];

export function ToolRunsPage() {
  const { workspaceId = "" } = useParams();
  const [status, setStatus] = useState("all");
  const runsQuery = useToolRuns(workspaceId, status);

  return (
    <>
      <PageHeader
        eyebrow="Tool jobs"
        title="Run history"
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]" aria-label="Filter run status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
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
