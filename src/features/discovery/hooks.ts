import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { competitorsApi, discoveryApi, propertiesApi, scopeApi } from "./api";
import type { Competitor, DiscoveredPage, PageType } from "./types";

export const discoveryKeys = {
  properties: (workspaceId: string) => ["workspaces", workspaceId, "properties"] as const,
  property: (workspaceId: string, propertyId: string) =>
    ["workspaces", workspaceId, "properties", propertyId] as const,
  competitors: (workspaceId: string) => ["workspaces", workspaceId, "competitors"] as const,
  pages: (workspaceId: string, propertyId?: string) =>
    ["workspaces", workspaceId, "discovered-pages", propertyId ?? "all"] as const,
  job: (workspaceId: string, jobId: string) => ["workspaces", workspaceId, "discovery-jobs", jobId] as const,
};

export function useProperties(workspaceId?: string) {
  return useQuery({
    queryKey: discoveryKeys.properties(workspaceId ?? ""),
    queryFn: () => propertiesApi.list(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useProperty(workspaceId?: string, propertyId?: string) {
  return useQuery({
    queryKey: discoveryKeys.property(workspaceId ?? "", propertyId ?? ""),
    queryFn: () => propertiesApi.get(workspaceId ?? "", propertyId ?? ""),
    enabled: Boolean(workspaceId && propertyId),
  });
}

export function useCreateProperty(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; url: string }) => propertiesApi.create(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discoveryKeys.properties(workspaceId) }),
  });
}

export function useCompetitors(workspaceId?: string) {
  return useQuery({
    queryKey: discoveryKeys.competitors(workspaceId ?? ""),
    queryFn: () => competitorsApi.list(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateCompetitor(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; url: string }) => competitorsApi.create(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discoveryKeys.competitors(workspaceId) }),
  });
}

export function useUpdateCompetitor(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Competitor> }) =>
      competitorsApi.update(workspaceId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discoveryKeys.competitors(workspaceId) }),
  });
}

export function useDiscoveredPages(workspaceId?: string, propertyId?: string) {
  return useQuery({
    queryKey: discoveryKeys.pages(workspaceId ?? "", propertyId),
    queryFn: () => discoveryApi.pages(workspaceId ?? "", propertyId),
    enabled: Boolean(workspaceId),
  });
}

export function useStartDiscoveryJob(workspaceId: string) {
  return useMutation({
    mutationFn: (input: { property_id: string }) => discoveryApi.startJob(workspaceId, input),
  });
}

export function useDiscoveryJob(workspaceId?: string, jobId?: string) {
  return useQuery({
    queryKey: discoveryKeys.job(workspaceId ?? "", jobId ?? ""),
    queryFn: () => discoveryApi.getJob(workspaceId ?? "", jobId ?? ""),
    enabled: Boolean(workspaceId && jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 3000 : false;
    },
  });
}

export function useUpdateDiscoveredPage(workspaceId: string, propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Pick<DiscoveredPage, "page_type" | "status" | "selected_for_assessment">>;
    }) => discoveryApi.updatePage(workspaceId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discoveryKeys.pages(workspaceId, propertyId) }),
  });
}

export function useAddManualPage(workspaceId: string, propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { property_id: string; url: string; page_type: PageType }) =>
      discoveryApi.addManualPage(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discoveryKeys.pages(workspaceId, propertyId) }),
  });
}

export function useApproveScope(workspaceId: string) {
  return useMutation({
    mutationFn: (input: { property_page_ids: string[]; competitor_page_ids: string[] }) =>
      scopeApi.create(workspaceId, input),
  });
}
