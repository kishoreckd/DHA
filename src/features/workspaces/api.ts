import { staticDha } from "@/lib/static-dha";
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceMember,
  WorkspacePermissions,
  WorkspaceUpdateInput,
} from "./types";

export const workspacesApi = {
  list: (): Promise<Workspace[]> => staticDha.workspaces.list(),
  create: (input: WorkspaceCreateInput): Promise<Workspace> => staticDha.workspaces.create(input),
  get: (workspaceId: string): Promise<Workspace> => staticDha.workspaces.get(workspaceId),
  update: (workspaceId: string, input: WorkspaceUpdateInput): Promise<Workspace> =>
    staticDha.workspaces.update(workspaceId, input),
  members: (workspaceId: string): Promise<WorkspaceMember[]> => staticDha.workspaces.members(workspaceId),
  permissions: (workspaceId: string): Promise<WorkspacePermissions> =>
    staticDha.workspaces.permissions(workspaceId),
};
