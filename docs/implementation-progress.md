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
