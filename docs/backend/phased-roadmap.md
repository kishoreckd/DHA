# DHA Backend Phased Roadmap

This roadmap splits backend implementation into separate product phases. Each phase must expose stable API contracts, persistence models, service logic, tests, and operational safeguards before the corresponding frontend phase is considered complete.

## Phase documents

| Phase | Document | Backend outcome |
|---|---|---|
| 0 | [Backend foundation](./phases/phase-00-foundation.md) | FastAPI structure, MongoDB access, error model, logging, tests |
| 1 | [Auth, organizations, workspaces](./phases/phase-01-auth-workspaces.md) | Users, organizations, workspaces, membership, session context |
| 2 | [Website intake and discovery](./phases/phase-02-discovery.md) | Properties, competitors, page discovery, approved scope |
| 3 | [Tool orchestration and artifacts](./phases/phase-03-tool-jobs.md) | Persistent jobs, tool runs, retries, artifacts, extracted measurements |
| 4 | [Methodology and metrics](./phases/phase-04-methodology.md) | Versioned metrics, weights, formulas, validation, publication |
| 5 | [Evidence review](./phases/phase-05-evidence.md) | Evidence decisions, manual evidence, sufficiency states |
| 6 | [Baseline generation](./phases/phase-06-baseline.md) | Baseline drafts, sections, findings, versioning |
| 7 | [Scoring, snapshots, and trends](./phases/phase-07-scoring-snapshot.md) | Authoritative scores, competitor comparison, immutable snapshots |
| 8 | [Review and approval](./phases/phase-08-review-approval.md) | Review workflow, comments, approvals, change requests |
| 9 | [Reports and publication](./phases/phase-09-reports-publication.md) | Report drafts, rendering jobs, HTML/PDF artifacts, publication |
| 10 | [Permissions and audit](./phases/phase-10-permissions-audit.md) | Fine-grained permissions, audit events, access controls |
| 11 | [Hardening and scale](./phases/phase-11-hardening.md) | Performance, indexes, observability, reliability, archival |

## Release grouping

### Release A - Intake and collection backend

Phases 0 to 3.

The backend can create workspace context, discover pages, run tools, persist runs, and expose artifacts/evidence candidates.

### Release B - Assessment intelligence backend

Phases 4 to 7.

The backend can manage methodology, review evidence, generate baselines, calculate authoritative scores, and produce snapshots.

### Release C - Governance and publishing backend

Phases 8 to 10.

The backend can manage review, approval, permissions, publication, and auditability.

### Release D - Production hardening

Phase 11.

The backend becomes production-grade for scale, reliability, observability, retention, and recovery.

## Cross-phase dependencies

| Capability | Depends on |
|---|---|
| Workspace APIs | Authentication and user identity |
| Discovery jobs | Workspace and property records |
| Tool jobs | Approved pages and tool catalog |
| Evidence review | Completed or partial tool runs |
| Baseline generation | Accepted evidence and methodology version |
| Scoring | Evidence observations and methodology formulas |
| Snapshot generation | Metric scores and competitor subjects |
| Review workflow | Versioned baseline/snapshot/report records |
| Publication | Approved report version and artifact rendering |
| Permissions | User, workspace, and resource context |
| Audit | All important commands and state transitions |

## Phase completion rule

Each phase must include:

1. MongoDB collection design.
2. Pydantic request/response schemas.
3. FastAPI routes.
4. Service-layer logic.
5. Permission checks.
6. Audit events for important mutations.
7. Tests for success and failure paths.
8. Frontend-ready API examples.
9. Operational notes for jobs, retries, and errors when relevant.

