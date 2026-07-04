import { apiRequest, jsonBody } from "@/lib/api/client";
import type { ArtifactSummary, Measurement, ToolBatch, ToolDefinition, ToolRun } from "./types";

export const toolJobsApi = {
  catalog: (): Promise<ToolDefinition[]> => apiRequest<ToolDefinition[]>("/api/gateway/tools"),
  createBatch: (
    workspaceId: string,
    input: {
      scope_id?: string;
      tool_keys: string[];
      page_ids: string[];
      name?: string;
      output_format?: "html" | "json" | "screenshot";
      upload_to_sharepoint?: boolean;
      include_raw?: boolean;
    },
  ) =>
    apiRequest<ToolBatch>(`/api/gateway/workspaces/${workspaceId}/tool-batches`, {
      method: "POST",
      body: jsonBody({
        output_format: "html",
        upload_to_sharepoint: false,
        include_raw: false,
        ...input,
      }),
    }),
  batches: (workspaceId: string): Promise<ToolBatch[]> =>
    apiRequest<ToolBatch[]>(`/api/gateway/workspaces/${workspaceId}/tool-batches`),
  batch: (workspaceId: string, batchId: string): Promise<ToolBatch> =>
    apiRequest<ToolBatch>(`/api/gateway/workspaces/${workspaceId}/tool-batches/${batchId}`),
  runs: (workspaceId: string, batchId?: string): Promise<ToolRun[]> => {
    const qs = batchId && batchId !== "all" ? `?batch_id=${encodeURIComponent(batchId)}` : "";
    return apiRequest<ToolRun[]>(`/api/gateway/workspaces/${workspaceId}/tool-runs${qs}`);
  },
  run: (workspaceId: string, runId: string) =>
    apiRequest<ToolRun>(`/api/gateway/workspaces/${workspaceId}/tool-runs/${runId}`),
  retryRun: (workspaceId: string, runId: string) =>
    apiRequest<ToolRun>(`/api/gateway/workspaces/${workspaceId}/tool-runs/${runId}/retry`, { method: "POST" }),
  cancelRun: (workspaceId: string, runId: string) =>
    apiRequest<ToolRun>(`/api/gateway/workspaces/${workspaceId}/tool-runs/${runId}/cancel`, { method: "POST" }),
  artifact: (workspaceId: string, artifactId: string) =>
    apiRequest<ArtifactSummary>(`/api/gateway/workspaces/${workspaceId}/artifacts/${artifactId}`),
};

export type { ArtifactSummary, Measurement, ToolBatch, ToolDefinition, ToolRun };
