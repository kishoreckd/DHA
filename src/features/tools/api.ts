import { staticDha } from "@/lib/static-dha";
import type { ArtifactSummary, Measurement, ToolBatch, ToolDefinition, ToolRun } from "./types";

export const toolJobsApi = {
  catalog: (workspaceId: string): Promise<ToolDefinition[]> => {
    void workspaceId;
    return staticDha.tools.catalog();
  },
  createBatch: (workspaceId: string, input: { tool_keys: string[]; page_ids: string[] }) =>
    staticDha.tools.createBatch(workspaceId, input),
  runs: (workspaceId: string, status?: string): Promise<ToolRun[]> =>
    staticDha.tools.runs(workspaceId, status),
  run: (workspaceId: string, runId: string) =>
    staticDha.tools.run(workspaceId, runId),
  retryRun: (workspaceId: string, runId: string) =>
    staticDha.tools.retryRun(workspaceId, runId),
  cancelRun: (workspaceId: string, runId: string) =>
    staticDha.tools.cancelRun(workspaceId, runId),
  artifactUrl: (workspaceId: string, runId: string, artifactId: string) =>
    staticDha.tools.artifactUrl(workspaceId, runId, artifactId),
  measurements: (workspaceId: string, runId: string) =>
    staticDha.tools.measurements(workspaceId, runId),
};

export type { ArtifactSummary, Measurement, ToolBatch, ToolDefinition, ToolRun };
