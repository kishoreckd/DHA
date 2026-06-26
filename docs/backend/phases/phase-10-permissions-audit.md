# Phase 10 - Permissions and Audit

## Goal

Implement fine-grained backend authorization and complete audit coverage.

## Main outcome

The backend controls access using permission keys and records important commands/state transitions.

## Collections

```text
permission_catalog
permission_groups
permission_assignments
resource_grants
audit_events
```

## Required APIs

```text
GET  /admin/permissions/catalog
GET  /admin/permissions/groups
POST /admin/permissions/groups
PATCH /admin/permissions/groups/{group_id}
POST /admin/permissions/assignments

GET /admin/audit-events
GET /workspaces/{workspace_id}/audit-events
```

## Acceptance gate

- Backend denies unauthorized actions even if frontend shows controls.
- Effective permissions can be fetched by frontend.
- Audit events can be filtered by actor, workspace, action, resource, and date.
