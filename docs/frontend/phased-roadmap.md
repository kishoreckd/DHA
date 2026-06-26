# DHA React TypeScript Frontend Phased Roadmap

This roadmap is intentionally split into separate phase documents so the team can plan, estimate, implement, and review one product slice at a time.

The target frontend is a React TypeScript single-page application, not Next.js. The frontend should use React Router for routing, TanStack Query for server-state, typed API services, and clean page-driven modules.

## Phase documents

| Phase | Document | Product outcome |
|---|---|---|
| 0 | [Foundation and frontend standards](./phases/phase-00-foundation.md) | Clean React app structure, API conventions, reusable UI states, testing baseline |
| 1 | [Organizations, workspaces, and shell](./phases/phase-01-workspaces-shell.md) | Workspace-aware authenticated product shell |
| 2 | [Website intake, competitors, and page discovery](./phases/phase-02-discovery.md) | URL intake becomes approved assessment scope |
| 3 | [Persistent tool jobs and evidence collection](./phases/phase-03-tool-jobs.md) | Persistent tool sync, retries, artifacts, run history |
| 4 | [Methodology and metric administration](./phases/phase-04-methodology-admin.md) | Admin-managed metrics, weights, thresholds, and tool mappings |
| 5 | [Evidence review and observations](./phases/phase-05-evidence-review.md) | Tool outputs become accepted/rejected evidence |
| 6 | [Baseline creation and authoring](./phases/phase-06-baseline.md) | 40-section baseline draft, editing, section workflow |
| 7 | [Scoring, snapshot, and trends](./phases/phase-07-scoring-snapshot.md) | 68-metric scoring, competitor comparison, snapshot versions |
| 8 | [Review, approval, and collaboration](./phases/phase-08-review-approval.md) | Controlled analyst/reviewer approval workflow |
| 9 | [Report composition and publication](./phases/phase-09-reports-publication.md) | HTML/PDF report drafts, previews, publication lifecycle |
| 10 | [Permissions and enterprise controls](./phases/phase-10-permissions.md) | Workspace, page, tool, report, and admin-level access control |
| 11 | [Hardening, scale, and analytics](./phases/phase-11-hardening.md) | Production readiness, performance, accessibility, telemetry |

## Recommended release grouping

### Release A - Intake and collection

Phases 0 to 3.

Users can create/access workspaces, enter a URL, approve pages and competitors, run tools, and inspect persistent run results.

### Release B - Assessment and scoring

Phases 4 to 7.

Admins can manage methodology. Analysts can review evidence, generate baselines, score metrics, create snapshots, and compare competitors.

### Release C - Review and publication

Phases 8 to 10.

Teams can review, approve, publish, and manage scoped access.

### Release D - Scale and optimization

Phase 11 and later improvements.

The product becomes robust for high data volume, multiple teams, accessibility audits, telemetry, and operational support.

## Cross-phase dependencies

| Capability | Depends on |
|---|---|
| Workspace shell | Auth, user profile, effective permissions |
| Page discovery | Workspace and website/property APIs |
| Competitor approval | Workspace and discovery context |
| Tool orchestration | Approved pages, selected tools, backend job APIs |
| Evidence review | Completed or partial tool runs |
| Baseline generation | Accepted evidence and methodology version |
| Snapshot generation | Metric scores and scoring service |
| Review approval | Versioned baseline/snapshot records |
| Publication | Approved report and frozen source versions |
| Fine-grained access | Backend permission evaluation |

## Frontend implementation rule

Each phase must include:

1. Routes and page skeletons.
2. TypeScript contracts.
3. API service functions.
4. TanStack Query hooks.
5. Loading, empty, error, denied, and success states.
6. Permission-gated actions.
7. Component tests for core behavior.
8. A short update to implementation progress documentation.

