# Frontend Implementation Progress

## Completed

- Migrated the runtime from Vite to Next.js App Router while keeping React and strict TypeScript.
- Added secure server route handlers for authentication, cookie sessions, authenticated user APIs, and crawler API-key proxying.
- Implemented login, first-admin setup, invitation activation, forgot/reset password, logout, profile, and password-change flows.
- Implemented the operational dashboard, all crawler tool synchronization, and full admin users/invitations/audit interface.
- Added responsive role-aware navigation, loading/error/empty states, confirmation flows, accessible labels, and neutral enterprise styling.

## Decisions

- JWTs are stored only in the `dha_access_token` HTTP-only cookie.
- `BACKEND_API_TOKEN_SECRET` and `CRAWLER_API_KEY` are read only by Next.js route handlers.
- Visual components call typed API modules and never call backend endpoints directly.
- The visible application only exposes features backed by the supplied APIs.

## Known Gaps

- Baseline, review, report, workspace, and publication features remain intentionally excluded until backend contracts are available.
- Browser verification requires a reachable backend or a configured test backend.

## Product Expansion Plan

The complete frontend delivery plan is now documented in:

- `docs/frontend/README.md`
- `docs/frontend/phased-roadmap.md`
- `docs/frontend/implementation-blueprint.md`

The matching backend delivery plan is now documented in:

- `docs/backend/README.md`
- `docs/backend/phased-roadmap.md`
- `docs/backend/implementation-blueprint.md`

The expanded product direction is a React TypeScript single-page application with React Router, TanStack Query, page-based routing folders, feature modules, typed API services, and a Python/FastAPI backend.

The previous Next.js notes above describe the existing/legacy implementation context only. New product planning should follow the React TypeScript SPA documents under `docs/frontend`.

The next recommended implementation boundary is the frontend foundation and workspace shell, followed by website intake, page discovery, competitor approval, and persistent tool-run workflows.
