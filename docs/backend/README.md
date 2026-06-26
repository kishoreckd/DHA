# DHA Backend Delivery Plan

This folder defines the backend plan for building the DHA Digital Assessment Platform using Python, FastAPI, MongoDB, background workers, and third-party tool integrations.

The backend is the source of truth for:

- Authentication and session validation.
- Organizations, workspaces, users, and permissions.
- Website intake, competitor management, and page discovery.
- Tool orchestration and long-running jobs.
- Raw evidence, extracted observations, and artifacts.
- Methodology versions, metric definitions, formulas, and weights.
- Baseline generation and versioning.
- Snapshot scoring and trend calculation.
- Review, approval, publication, and audit trails.

The frontend should display and operate on backend-provided state. The frontend must not calculate authoritative scores, permission decisions, methodology outputs, or publication eligibility.

## Current backend reference

The existing backend application lives under `app/` and already uses direct FastAPI route registration through `app/api/routes`, not an `/api/v1` route structure.

Current implemented areas include:

- `app/main.py` for FastAPI setup, CORS, logging middleware, security headers, `/health`, and route registration.
- `app/core/config.py` for settings and tool configuration.
- `app/core/db.py` for Motor/MongoDB connection lifecycle.
- `app/api/dependencies.py` for authenticated user and admin dependencies.
- `app/api/routes/auth_routes.py` for signup, login, logout, invitation, and password reset flows.
- `app/api/routes/user_routes.py` and `admin_user_routes.py` for profile and user administration.
- `app/api/routes/crawler.py` for current tool/crawler endpoints.
- `app/api/routes/baseline_routes.py` for the current baseline persistence APIs.
- `app/services/Tools/` for the current tool scrapers/integrations.

New backend work should extend this structure unless the team intentionally approves a refactor.

## Planning documents

- [Phased roadmap](./phased-roadmap.md) - backend delivery phases, dependencies, and acceptance gates.
- [Implementation blueprint](./implementation-blueprint.md) - Python/FastAPI architecture, MongoDB collections, service layers, jobs, APIs, permissions, testing, and first sprint plan.

## Separate phase documents

- [Phase 00 - Backend foundation](./phases/phase-00-foundation.md)
- [Phase 01 - Auth, organizations, workspaces](./phases/phase-01-auth-workspaces.md)
- [Phase 02 - Website intake and discovery](./phases/phase-02-discovery.md)
- [Phase 03 - Tool orchestration and artifacts](./phases/phase-03-tool-jobs.md)
- [Phase 04 - Methodology and metrics](./phases/phase-04-methodology.md)
- [Phase 05 - Evidence review](./phases/phase-05-evidence.md)
- [Phase 06 - Baseline generation](./phases/phase-06-baseline.md)
- [Phase 07 - Scoring, snapshots, and trends](./phases/phase-07-scoring-snapshot.md)
- [Phase 08 - Review and approval](./phases/phase-08-review-approval.md)
- [Phase 09 - Reports and publication](./phases/phase-09-reports-publication.md)
- [Phase 10 - Permissions and audit](./phases/phase-10-permissions-audit.md)
- [Phase 11 - Hardening and scale](./phases/phase-11-hardening.md)

## Product objective

The backend must support this complete workflow:

```text
URL intake
  -> workspace/property creation
  -> page and competitor discovery
  -> scope approval
  -> tool job orchestration
  -> artifact and evidence storage
  -> evidence review
  -> methodology-backed scoring
  -> baseline generation
  -> snapshot generation
  -> review and approval
  -> report rendering
  -> versioned publication
  -> historical comparison
```

## Backend principles

1. Keep API contracts explicit and version-aware.
2. Use MongoDB for operational documents, not as a dumping ground for unbounded blobs.
3. Store large artifacts in object storage or a dedicated artifact layer, not directly inside core MongoDB documents.
4. Treat discovery, tool sync, baseline generation, snapshot generation, and report rendering as background jobs.
5. Keep every important state transition auditable.
6. Never overwrite approved or published versions.
7. Separate raw tool output, normalized evidence, metric observations, scoring results, and report content.
8. Make permissions backend-authoritative.
9. Design APIs for frontend workflows, not only database CRUD.
10. Prefer clear service boundaries over giant route files.
