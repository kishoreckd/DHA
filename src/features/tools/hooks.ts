import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toolJobsApi } from "./api";
import type { ToolRunStatus } from "./types";

export const toolJobKeys = {
  catalog: (workspaceId: string) => ["workspaces", workspaceId, "tools"] as const,
  runs: (workspaceId: string, status = "all") => ["workspaces", workspaceId, "tool-runs", status] as const,
  run: (workspaceId: string, runId: string) => ["workspaces", workspaceId, "tool-runs", runId] as const,
  measurements: (workspaceId: string, runId: string) =>
    ["workspaces", workspaceId, "tool-runs", runId, "measurements"] as const,
};

const liveStatuses: ToolRunStatus[] = ["queued", "running"];

export function useToolCatalog(workspaceId?: string) {
  return useQuery({
    queryKey: toolJobKeys.catalog(workspaceId ?? ""),
    queryFn: () => toolJobsApi.catalog(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useToolRuns(workspaceId?: string, status = "all") {
  return useQuery({
    queryKey: toolJobKeys.runs(workspaceId ?? "", status),
    queryFn: () => toolJobsApi.runs(workspaceId ?? "", status),
    enabled: Boolean(workspaceId),
    refetchInterval: (query) =>
      query.state.data?.some((run) => liveStatuses.includes(run.status)) ? 3000 : false,
  });
}

export function useToolRun(workspaceId?: string, runId?: string) {
  return useQuery({
    queryKey: toolJobKeys.run(workspaceId ?? "", runId ?? ""),
    queryFn: () => toolJobsApi.run(workspaceId ?? "", runId ?? ""),
    enabled: Boolean(workspaceId && runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && liveStatuses.includes(status) ? 3000 : false;
    },
  });
}

export function useToolRunMeasurements(workspaceId?: string, runId?: string) {
  return useQuery({
    queryKey: toolJobKeys.measurements(workspaceId ?? "", runId ?? ""),
    queryFn: () => toolJobsApi.measurements(workspaceId ?? "", runId ?? ""),
    enabled: Boolean(workspaceId && runId),
  });
}

export function useCreateToolBatch(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tool_keys: string[]; page_ids: string[] }) =>
      toolJobsApi.createBatch(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "tool-runs"] }),
  });
}

export function useRetryToolRun(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => toolJobsApi.retryRun(workspaceId, runId),
    onSuccess: (run) => {
      queryClient.setQueryData(toolJobKeys.run(workspaceId, run.id), run);
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "tool-runs"] });
    },
  });
}

export function useArtifactUrl(workspaceId: string, runId: string) {
  return useMutation({
    mutationFn: (artifactId: string) => toolJobsApi.artifactUrl(workspaceId, runId, artifactId),
  });
}
