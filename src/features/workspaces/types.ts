export type PermissionKey =
  | "workspace.view"
  | "workspace.manage"
  | "discovery.run"
  | "scope.approve"
  | "tool.run"
  | "evidence.review"
  | "baseline.edit"
  | "score.edit"
  | "assessment.review"
  | "report.edit"
  | "report.publish"
  | "methodology.manage"
  | "users.manage"
  | "permissions.manage"
  | "audit.view";

export type Organization = {
  id: string;
  name: string;
  slug?: string | null;
};

export type WorkspaceStatus = "active" | "draft" | "archived";

export type Workspace = {
  id: string;
  organization_id: string;
  organization?: Organization | null;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  primary_domain?: string | null;
  description?: string | null;
  member_count?: number;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMemberRole = "owner" | "admin" | "editor" | "analyst" | "viewer";
export type WorkspaceMemberStatus = "active" | "invited" | "disabled";

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  display_name?: string | null;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
  permissions: PermissionKey[];
  created_at: string;
  updated_at: string;
};

export type WorkspacePermissions = {
  workspace_id: string;
  permissions: PermissionKey[];
};

export type WorkspaceCreateInput = {
  name: string;
  slug?: string;
  primary_domain?: string;
  description?: string;
};

export type WorkspaceUpdateInput = Partial<
  Pick<WorkspaceCreateInput, "name" | "slug" | "primary_domain" | "description">
> & {
  status?: WorkspaceStatus;
};
