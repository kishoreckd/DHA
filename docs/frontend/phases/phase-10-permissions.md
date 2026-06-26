# Phase 10 - Permissions and Enterprise Controls

## Goal

Move beyond simple `admin` and `user` roles into scoped authorization across workspaces, pages, tools, assessments, reviews, and publications.

## Main outcome

Navigation and actions are driven by backend-provided effective permissions.

## Routes

```text
/admin/permissions
/admin/audit-logs
/workspaces/:workspaceId/settings/access
```

## Page files

```text
src/pages/admin/permissions/
  PermissionsPage.tsx

src/pages/admin/audit/
  AuditLogsPage.tsx

src/pages/workspace-access/
  WorkspaceAccessPage.tsx
```

## Feature files

```text
src/features/permissions/
src/features/audit/
```

## Main UI

- Permission group editor.
- Workspace access editor.
- Tool access editor.
- Page/module access editor.
- Reviewer/publisher access editor.
- Access denied explanations.
- Audit log browser.

## API contracts needed

- Get permission catalog.
- Get effective user permissions.
- List permission groups.
- Create/update permission group.
- Assign permission group.
- List audit events.
- Filter audit events.

## Implementation checklist

1. Define permission catalog and grant types.
2. Replace role checks with permission checks.
3. Add `PermissionGate` usage in navigation and actions.
4. Build admin permission editor.
5. Build audit log browser.
6. Add tests for hidden, disabled, and denied actions.

## Acceptance gate

- Frontend receives effective permissions from backend.
- Backend `403` remains authoritative.
- Permission changes do not require frontend deployment.
- Users get clear explanations when access is denied.

