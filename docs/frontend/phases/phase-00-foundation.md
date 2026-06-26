# Phase 00 - Foundation and Frontend Standards

## Goal

Create a clean React TypeScript foundation before building the larger assessment platform.

This phase is about discipline: folder structure, API patterns, route conventions, reusable UI states, permission handling, and tests. If this is weak, every later module will become slow and messy.

## Main outcome

A stable React SPA foundation that every later phase can follow.

## Recommended routes

```text
/login
/forgot-password
/reset-password
/dashboard
/unauthorized
/not-found
```

## Folder impact

```text
src/
  app/
    App.tsx
    router.tsx
    providers/
    layouts/
  pages/
    auth/
    dashboard/
    errors/
  shared/
    api/
    components/
    config/
    hooks/
    lib/
    types/
  test/
```

## Frontend standards to establish

- React Router route definitions live in `src/app/router.tsx`.
- Page components live inside `src/pages`.
- Feature business components live inside `src/features`.
- Reusable UI components live inside `src/shared/components`.
- API calls live inside `src/shared/api` or feature-specific `api.ts` files.
- Common backend response types live in `src/shared/types/api.ts`.
- Backend data models live in `src/types`.
- UI-only view models stay close to the page or feature that owns them.
- No component should call `fetch` directly unless it is an API adapter.
- All server-state should go through TanStack Query.
- Forms should use React Hook Form plus Zod when validation is non-trivial.

## Required shared components

- `PageLoader`
- `PageError`
- `EmptyState`
- `AccessDenied`
- `NotFoundState`
- `StatusBadge`
- `ConfirmDialog`
- `FormDrawer`
- `DataTable`
- `FilterBar`
- `Pagination`
- `PermissionGate`

## Required shared utilities

- API client wrapper.
- API error normalizer.
- Query key factory.
- Date formatting.
- Score formatting.
- Duration formatting.
- Status label formatting.
- Permission helper.
- Route path builder.

## Implementation checklist

1. Confirm Vite or existing React build setup.
2. Add or clean `src/app/router.tsx`.
3. Add route-level layouts:
   - Public layout
   - Authenticated layout
   - Admin layout
4. Create shared API client with typed errors.
5. Create shared query keys.
6. Create common page-state components.
7. Create permission helpers.
8. Add a small test for route rendering.
9. Add a small test for API error normalization.
10. Update the implementation progress document.

## User-facing copy rule

- Do not use internal security, compliance, or access-control slogans in visible UI. Use product workflow language instead.
- Do not add descriptions to every page, card, panel, or container by default. Use descriptive copy only when it removes ambiguity or prevents user error.

## Acceptance gate

- The app builds successfully.
- Authentication routes still work.
- Dashboard route is protected.
- Shared page states are available.
- One existing flow uses the new API/query conventions.
- Tests pass.
