# Phase 01 - Auth, Organizations, and Workspaces

## Goal

Create the backend identity and tenant model for organizations, workspaces, membership, and user access.

## Main outcome

The frontend can authenticate users, list assigned workspaces, and enforce workspace-scoped access.

## Current backend reference

The current application already has auth, invitation, password reset, profile, and admin user management routes:

```text
/signup
/login
/logout
/auth/invitations/verify
/auth/set-password
/auth/forgot-password
/auth/reset-password
/users/me
/users/me/change-password
/users
/users/invitations
/users/audit-logs
/users/{user_id}
```

Do not rebuild these flows from scratch. Extend them from role-based access into organization/workspace membership and effective permissions.

## Collections

```text
users
organizations
workspaces
workspace_memberships
sessions_or_refresh_tokens
invitations
audit_events
```

## Required APIs

```text
POST /login
POST /logout
GET  /users/me

GET  /workspaces
POST /workspaces
GET  /workspaces/{workspace_id}
PATCH /workspaces/{workspace_id}

GET  /workspaces/{workspace_id}/members
POST /workspaces/{workspace_id}/members
PATCH /workspaces/{workspace_id}/members/{member_id}
DELETE /workspaces/{workspace_id}/members/{member_id}

GET /workspaces/{workspace_id}/permissions/me
```

## Service modules

```text
services/auth_service.py
services/user_service.py
services/workspace_service.py
services/membership_service.py
permissions/permission_service.py
```

## Acceptance gate

- User identity is available to every protected route.
- Users see only assigned workspaces.
- Workspace access is backend-authoritative.
- Membership changes create audit events.
