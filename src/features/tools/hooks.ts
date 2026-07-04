import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toolJobsApi } from "./api";
import type { ToolRunStatus } from "./types";

export const toolJobKeys = {
  catalog: (workspaceId: string) => ["workspaces", workspaceId, "tools"] as const,
  batches: (workspaceId: string) => ["workspaces", workspaceId, "tool-batches"] as const,
  runs: (workspaceId: string, batchId = "all") => ["workspaces", workspaceId, "tool-runs", batchId] as const,
  run: (workspaceId: string, runId: string) => ["workspaces", workspaceId, "tool-runs", runId] as const,
  artifact: (workspaceId: string, artifactId: string) => ["workspaces", workspaceId, "artifacts", artifactId] as const,
};

const liveStatuses: ToolRunStatus[] = ["queued", "running"];

export function useToolCatalog(workspaceId?: string) {
  return useQuery({
    queryKey: toolJobKeys.catalog(workspaceId ?? ""),
    queryFn: () => toolJobsApi.catalog(),
    enabled: Boolean(workspaceId),
  });
}

export function useToolBatches(workspaceId?: string) {
  return useQuery({
    queryKey: toolJobKeys.batches(workspaceId ?? ""),
    queryFn: () => toolJobsApi.batches(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useToolRuns(workspaceId?: string, batchId = "all") {
  return useQuery({
    queryKey: toolJobKeys.runs(workspaceId ?? "", batchId),
    queryFn: () => toolJobsApi.runs(workspaceId ?? "", batchId),
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

export function useCreateToolBatch(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof toolJobsApi.createBatch>[1]) =>
      toolJobsApi.createBatch(workspaceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toolJobKeys.batches(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "tool-runs"] });
    },
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

export function useCancelToolRun(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => toolJobsApi.cancelRun(workspaceId, runId),
    onSuccess: (run) => {
      queryClient.setQueryData(toolJobKeys.run(workspaceId, run.id), run);
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "tool-runs"] });
    },
  });
}

export function useArtifact(workspaceId?: string, artifactId?: string) {
  return useQuery({
    queryKey: toolJobKeys.artifact(workspaceId ?? "", artifactId ?? ""),
    queryFn: () => toolJobsApi.artifact(workspaceId ?? "", artifactId ?? ""),
    enabled: Boolean(workspaceId && artifactId),
  });
}
