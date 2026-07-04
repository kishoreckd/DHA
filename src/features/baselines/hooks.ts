import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baselinesApi } from "./api";
import type { BaselineCreateInput, BaselineStatus } from "./types";

export const baselineKeys = {
  all: ["baselines"] as const,
  detail: (baselineId: string) => ["baselines", baselineId] as const,
};

export function useBaselines() {
  return useQuery({
    queryKey: baselineKeys.all,
    queryFn: baselinesApi.list,
  });
}

export function useBaseline(baselineId?: string) {
  return useQuery({
    queryKey: baselineKeys.detail(baselineId ?? ""),
    queryFn: () => baselinesApi.get(baselineId ?? ""),
    enabled: Boolean(baselineId),
  });
}

export function useCreateBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BaselineCreateInput) => baselinesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: baselineKeys.all }),
  });
}

export function useUpdateBaselineStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BaselineStatus }) =>
      baselinesApi.updateStatus(id, status),
    onSuccess: (baseline) => {
      queryClient.invalidateQueries({ queryKey: baselineKeys.all });
      queryClient.setQueryData(baselineKeys.detail(baseline.id), baseline);
    },
  });
}

export function useArchiveBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: baselinesApi.archive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: baselineKeys.all }),
  });
}
