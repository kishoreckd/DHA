# Phase 01 - Organizations, Workspaces, and Product Shell

## Goal

Introduce the main product context: organization, workspace, website, current assessment, and user permissions.

The application should stop feeling like isolated screens and start feeling like a workspace-based assessment product.

## Main outcome

Users can see their assigned workspaces, switch between them, and access workspace-scoped navigation.

## Routes

```text
/workspaces
/workspaces/new
/workspaces/:workspaceId
/workspaces/:workspaceId/settings
/workspaces/:workspaceId/members
```

## Page files

```text
src/pages/workspaces/
  WorkspacesListPage.tsx
  WorkspaceCreatePage.tsx
  WorkspaceOverviewPage.tsx
  WorkspaceSettingsPage.tsx
  WorkspaceMembersPage.tsx
```

## Feature files

```text
src/features/workspaces/
  api.ts
  hooks.ts
  types.ts
  components/
    WorkspaceCard.tsx
    WorkspaceHeader.tsx
    WorkspaceSwitcher.tsx
    WorkspaceStatusBadge.tsx
    WorkspaceCreateForm.tsx
```

## Main UI

- Workspace list.
- Workspace create form.
- Workspace detail header.
- Workspace switcher in the authenticated shell.
- Workspace settings.
- Workspace members table.
- Permission-aware navigation.

## API contracts needed

- List workspaces assigned to current user.
- Create workspace.
- Get workspace detail.
- Update workspace settings.
- List workspace members.
- Add/remove/update member access.
- Get effective permissions for workspace.

## Implementation checklist

1. Define `Workspace`, `Organization`, `WorkspaceMember`, and `PermissionKey` types.
2. Add workspace API service.
3. Add `useWorkspaces`, `useWorkspace`, and `useWorkspacePermissions` hooks.
4. Add workspace list route.
5. Add create workspace route.
6. Add workspace detail layout.
7. Add workspace switcher.
8. Add permission-gated workspace navigation.
9. Add tests for access denied and workspace switching.

## Acceptance gate

- Users only see assigned workspaces.
- Direct URL access shows denied/not-found correctly.
- Workspace navigation updates when the selected workspace changes.
- Workspace permissions are read from backend data, not hardcoded roles.

