import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { methodologiesApi } from "./api";
import type { MetricDefinition } from "./types";

export const methodologyKeys = {
  all: ["methodologies"] as const,
  detail: (methodologyId: string) => ["methodologies", methodologyId] as const,
  metrics: (methodologyId: string) => ["methodologies", methodologyId, "metrics"] as const,
  validation: (methodologyId: string) => ["methodologies", methodologyId, "validation"] as const,
  adminTools: ["admin-tools"] as const,
};

export function useMethodologies() {
  return useQuery({ queryKey: methodologyKeys.all, queryFn: methodologiesApi.list });
}

export function useMethodology(methodologyId?: string) {
  return useQuery({
    queryKey: methodologyKeys.detail(methodologyId ?? ""),
    queryFn: () => methodologiesApi.get(methodologyId ?? ""),
    enabled: Boolean(methodologyId),
  });
}

export function useCreateMethodology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) => methodologiesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: methodologyKeys.all }),
  });
}

export function useCloneMethodology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (methodologyId: string) => methodologiesApi.clone(methodologyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: methodologyKeys.all }),
  });
}

export function useMethodologyMetrics(methodologyId?: string) {
  return useQuery({
    queryKey: methodologyKeys.metrics(methodologyId ?? ""),
    queryFn: () => methodologiesApi.metrics(methodologyId ?? ""),
    enabled: Boolean(methodologyId),
  });
}

export function useUpsertMetric(methodologyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<MetricDefinition>) => methodologiesApi.upsertMetric(methodologyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: methodologyKeys.metrics(methodologyId) });
      queryClient.invalidateQueries({ queryKey: methodologyKeys.adminTools });
    },
  });
}

export function useValidateMethodology(methodologyId: string) {
  return useMutation({ mutationFn: () => methodologiesApi.validate(methodologyId) });
}

export function usePublishMethodology(methodologyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => methodologiesApi.publish(methodologyId),
    onSuccess: (methodology) => {
      queryClient.setQueryData(methodologyKeys.detail(methodologyId), methodology);
      queryClient.invalidateQueries({ queryKey: methodologyKeys.all });
    },
  });
}

export function useAdminTools() {
  return useQuery({ queryKey: methodologyKeys.adminTools, queryFn: methodologiesApi.adminTools });
}
