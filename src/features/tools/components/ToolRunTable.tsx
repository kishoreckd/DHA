import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ToolRun } from "../types";
import { ToolRunStatusBadge } from "./ToolRunStatusBadge";

export function ToolRunTable({ runs, workspaceId }: { runs: ToolRun[]; workspaceId: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="border-b text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">Tool</th>
            <th className="px-3 py-2 font-semibold">Page</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Attempt</th>
            <th className="px-3 py-2 font-semibold">Queued</th>
            <th className="px-3 py-2 font-semibold">Completed</th>
            <th className="px-3 py-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {runs.map((run) => (
            <tr key={run.id}>
              <td className="px-3 py-3 font-medium">{run.tool_name || run.tool_key}</td>
              <td className="max-w-[280px] truncate px-3 py-3 text-muted-foreground">
                {run.page_url || "Workspace run"}
              </td>
              <td className="px-3 py-3">
                <ToolRunStatusBadge status={run.status} />
              </td>
              <td className="px-3 py-3">{run.attempt}</td>
              <td className="px-3 py-3 text-muted-foreground">
                {new Date(run.queued_at).toLocaleString()}
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {run.completed_at ? new Date(run.completed_at).toLocaleString() : "-"}
              </td>
              <td className="px-3 py-3">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/workspaces/${workspaceId}/tool-runs/${run.id}`}>Open</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
