import { apiRequest, jsonBody } from "@/lib/api/client";
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceMember,
  WorkspacePermissions,
  WorkspaceUpdateInput,
} from "./types";

export const workspacesApi = {
  list: (): Promise<Workspace[]> => apiRequest<Workspace[]>("/api/gateway/workspaces"),
  create: (input: WorkspaceCreateInput): Promise<Workspace> =>
    apiRequest<Workspace>("/api/gateway/workspaces", { method: "POST", body: jsonBody(input) }),
  get: (workspaceId: string): Promise<Workspace> =>
    apiRequest<Workspace>(`/api/gateway/workspaces/${workspaceId}`),
  update: (workspaceId: string, input: WorkspaceUpdateInput): Promise<Workspace> =>
    apiRequest<Workspace>(`/api/gateway/workspaces/${workspaceId}`, {
      method: "PATCH",
      body: jsonBody(input),
    }),
  members: (workspaceId: string): Promise<WorkspaceMember[]> =>
    apiRequest<WorkspaceMember[]>(`/api/gateway/workspaces/${workspaceId}/members`),
  addMember: (workspaceId: string, input: { user_email: string; role: WorkspaceMember["role"] }): Promise<WorkspaceMember> =>
    apiRequest<WorkspaceMember>(`/api/gateway/workspaces/${workspaceId}/members`, {
      method: "POST",
      body: jsonBody(input),
    }),
  updateMember: (workspaceId: string, memberId: string, input: { role: WorkspaceMember["role"] }): Promise<WorkspaceMember> =>
    apiRequest<WorkspaceMember>(`/api/gateway/workspaces/${workspaceId}/members/${memberId}`, {
      method: "PATCH",
      body: jsonBody(input),
    }),
  removeMember: (workspaceId: string, memberId: string): Promise<null> =>
    apiRequest<null>(`/api/gateway/workspaces/${workspaceId}/members/${memberId}`, { method: "DELETE" }),
  permissions: (workspaceId: string): Promise<WorkspacePermissions> =>
    apiRequest<WorkspacePermissions>(`/api/gateway/workspaces/${workspaceId}/permissions/me`),
};
