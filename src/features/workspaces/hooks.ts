import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspacesApi } from "./api";
import type { PermissionKey, WorkspaceCreateInput, WorkspaceMemberRole, WorkspaceUpdateInput } from "./types";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (workspaceId: string) => ["workspaces", workspaceId] as const,
  members: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  permissions: (workspaceId: string) => ["workspaces", workspaceId, "permissions"] as const,
};

export function useWorkspaces() {
  return useQuery({ queryKey: workspaceKeys.all, queryFn: workspacesApi.list });
}

export function useWorkspace(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId ?? ""),
    queryFn: () => workspacesApi.get(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useWorkspaceMembers(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId ?? ""),
    queryFn: () => workspacesApi.members(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useWorkspacePermissions(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceKeys.permissions(workspaceId ?? ""),
    queryFn: () => workspacesApi.permissions(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useHasWorkspacePermission(workspaceId: string | undefined, permission: PermissionKey) {
  const query = useWorkspacePermissions(workspaceId);
  return {
    ...query,
    hasPermission: Boolean(query.data?.permissions.includes(permission)),
  };
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkspaceCreateInput) => workspacesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
  });
}

export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkspaceUpdateInput) => workspacesApi.update(workspaceId, input),
    onSuccess: (workspace) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), workspace);
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useAddWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { user_email: string; role: WorkspaceMemberRole }) =>
      workspacesApi.addMember(workspaceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) }),
  });
}

export function useUpdateWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceMemberRole }) =>
      workspacesApi.updateMember(workspaceId, memberId, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) }),
  });
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => workspacesApi.removeMember(workspaceId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) }),
  });
}
