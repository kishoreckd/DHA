import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { competitorsApi, discoveryApi, propertiesApi, scopeApi } from "./api";
import type { Competitor, DiscoveredPage, PageType } from "./types";

export const discoveryKeys = {
  properties: (workspaceId: string) => ["workspaces", workspaceId, "properties"] as const,
  property: (workspaceId: string, propertyId: string) =>
    ["workspaces", workspaceId, "properties", propertyId] as const,
  competitors: (workspaceId: string) => ["workspaces", workspaceId, "competitors"] as const,
  pages: (workspaceId: string, propertyId?: string, scopeStatus = "pending") =>
    ["workspaces", workspaceId, "discovered-pages", propertyId ?? "all", scopeStatus] as const,
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

export function useCompetitors(workspaceId?: string, propertyId?: string) {
  return useQuery({
    queryKey: [...discoveryKeys.competitors(workspaceId ?? ""), propertyId ?? "all"] as const,
    queryFn: () => competitorsApi.list(workspaceId ?? "", propertyId),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateCompetitor(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; url: string; property_id?: string }) =>
      competitorsApi.create(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discoveryKeys.competitors(workspaceId) }),
  });
}

export function useSuggestCompetitors(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { property_id?: string }) => competitorsApi.suggest(workspaceId, input),
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

export function useDiscoveredPages(workspaceId?: string, propertyId?: string, scopeStatus = "pending") {
  return useQuery({
    queryKey: discoveryKeys.pages(workspaceId ?? "", propertyId, scopeStatus),
    queryFn: () => discoveryApi.pages(workspaceId ?? "", propertyId, scopeStatus),
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

export function useUpdateDiscoveredPage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Pick<DiscoveredPage, "page_type" | "status" | "scope_status" | "selected_for_assessment" | "excluded_reason">>;
    }) => discoveryApi.updatePage(workspaceId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "discovered-pages"] }),
  });
}

export function useAddManualPage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { property_id: string; url: string; title?: string; page_type: PageType }) =>
      discoveryApi.addManualPage(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "discovered-pages"] }),
  });
}

export function useApproveScope(workspaceId: string) {
  return useMutation({
    mutationFn: async (input: { property_id: string; notes?: string | null }) => {
      const draft = await scopeApi.create(workspaceId, input);
      await scopeApi.submit(workspaceId, draft.id, input.notes ?? "Ready for approval.");
      return scopeApi.approve(workspaceId, draft.id, input.notes ?? "Approved.");
    },
  });
}

export function useScopes(workspaceId?: string, propertyId?: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceId ?? "", "assessment-scopes", propertyId ?? "all"] as const,
    queryFn: () => scopeApi.list(workspaceId ?? "", propertyId),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateScope(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { property_id: string; notes?: string | null }) => scopeApi.create(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "assessment-scopes"] }),
  });
}

export function useSubmitScope(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scopeId, notes }: { scopeId: string; notes?: string | null }) =>
      scopeApi.submit(workspaceId, scopeId, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "assessment-scopes"] }),
  });
}

export function useApproveExistingScope(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scopeId, notes }: { scopeId: string; notes?: string | null }) =>
      scopeApi.approve(workspaceId, scopeId, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "assessment-scopes"] }),
  });
}
