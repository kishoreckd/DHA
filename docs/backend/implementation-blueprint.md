# DHA Python MongoDB Backend Implementation Blueprint

This document describes how to build the DHA Digital Assessment Platform backend using Python, FastAPI, MongoDB, background workers, and third-party tool integrations.

The backend target is:

- Python 3.11+
- FastAPI
- Pydantic v2
- MongoDB
- Motor or PyMongo async driver
- Background worker system
- Object/artifact storage
- Structured logging
- Pytest

## 1. Backend responsibility

The backend is the product source of truth.

It owns:

- Authentication and identity.
- Organization, workspace, membership, and permission decisions.
- Website properties, competitors, discovered pages, and approved assessment scope.
- Tool catalog, tool execution, job state, retries, and artifacts.
- Raw tool outputs, normalized measurements, evidence, and evidence decisions.
- Methodology definitions, metric configuration, formulas, thresholds, and weights.
- Baseline generation and versioning.
- Authoritative scoring, snapshots, rollups, and trend points.
- Review, approval, comments, report rendering, publication, and audit trails.

The frontend should request, display, and mutate backend state through APIs. It must not become the source of truth.

## 2. Implementation discipline and anti-hallucination rules

Do not invent backend behavior from general knowledge or assumptions. Use only:

- Approved product requirements.
- Approved frontend/backend planning documents.
- Agreed API contracts.
- Actual third-party tool capabilities.
- Real workbook-derived methodology once it is modeled.
- Explicit admin configuration stored in the database.

Do not hallucinate missing metrics, scoring formulas, dimensions, report sections, crawler behavior, permission rules, job states, or publication logic.

If a required rule is unknown:

1. Add a clearly named placeholder or TODO only when needed for scaffolding.
2. Keep it isolated.
3. Do not make it authoritative.
4. Document the missing contract.

The backend must not fake final business results. It may return development fixtures only through explicitly marked dev/test adapters.

## 3. Backend architecture

```text
FastAPI app
  |
  +-- API routes
  |     |
  |     v
  +-- service layer
  |     |
  |     +-- repositories
  |     +-- permission service
  |     +-- audit service
  |     +-- job service
  |
  +-- background workers
  |     |
  |     +-- discovery jobs
  |     +-- tool jobs
  |     +-- baseline generation
  |     +-- scoring/snapshot generation
  |     +-- report rendering
  |
  +-- integrations
  |     |
  |     +-- third-party tools
  |     +-- artifact storage
  |     +-- crawler/discovery providers
  |
  v
MongoDB + artifact storage
```

## 4. Recommended source structure

The current backend already exists under `app/`. Do not replace it with a new `api/v1` structure. Extend the current route-registration pattern:

```text
app/main.py
  -> app.api.register_all_routes(app)
  -> app/api/routes/*.py
```

Current observed structure:

```text
app/
  main.py
  logging_config.py
  api/
    __init__.py
    dependencies.py
    routes/
      auth_routes.py
      user_routes.py
      admin_user_routes.py
      crawler.py
      baseline_routes.py
  core/
    config.py
    db.py
    startup.py
  models/
    user_model.py
    crawler.py
    baseline_model.py
  schemas/
    user_schema.py
    baseline_schema.py
  services/
    auth.py
    auth_common.py
    user_service.py
    invitation_service.py
    email_service.py
    email_template_service.py
    Tools/
      crawler.py
      pagespeed_scraper.py
      gtmetrix_scraper.py
      webpage_scraper.py
      pingdom_scraper.py
      ssllabs_scraper.py
      dnschecker_scraper.py
      websitepulse_scraper.py
      beacon_scraper.py
      catchpoint_scraper.py
      httpsecurityheaders_scraper.py
      silktide_extension_scraper.py
      ocr_space.py
  templates/
    email/
  utils/
    auth.py
    report_paths.py
    tool_capture.py
    validator/
```

The target structure should evolve from this, not fight it:

```text
app/
  main.py

  api/
    __init__.py
    dependencies.py
    routes/
      auth_routes.py
      user_routes.py
      admin_user_routes.py
      crawler.py
      baseline_routes.py
      workspace_routes.py
      property_routes.py
      competitor_routes.py
      discovery_routes.py
      tool_run_routes.py
      evidence_routes.py
      methodology_routes.py
      scoring_routes.py
      snapshot_routes.py
      review_routes.py
      report_routes.py
      publication_routes.py
      permission_routes.py
      audit_routes.py

  core/
    config.py
    security.py
    errors.py
    logging.py
    pagination.py
    correlation.py
    time.py

  db/
    mongo.py
    indexes.py
    collections.py
    object_ids.py

  schemas/
    common.py
    auth.py
    workspace.py
    property.py
    competitor.py
    discovery.py
    tools.py
    assessment.py
    evidence.py
    methodology.py
    metric.py
    baseline.py
    scoring.py
    snapshot.py
    review.py
    report.py
    publication.py
    permissions.py
    audit.py

  models/
    enums.py
    common.py

  repositories/
    base.py
    users.py
    workspaces.py
    properties.py
    discovery.py
    tool_runs.py
    evidence.py
    methodologies.py
    baselines.py
    scoring.py
    reviews.py
    reports.py
    permissions.py
    audit.py

  services/
    auth_service.py
    workspace_service.py
    discovery_service.py
    tool_service.py
    evidence_service.py
    methodology_service.py
    baseline_service.py
    scoring_service.py
    snapshot_service.py
    review_service.py
    report_service.py
    publication_service.py

  jobs/
    queue.py
    schemas.py
    dispatcher.py
    workers/
      discovery_worker.py
      tool_worker.py
      baseline_worker.py
      snapshot_worker.py
      report_worker.py

  integrations/
    artifact_storage.py
    discovery_provider.py
    tools/
      base.py
      registry.py

  permissions/
    keys.py
    checks.py
    dependency.py
    service.py

  audit/
    service.py
    events.py

  tests/
    conftest.py
    factories/
    unit/
    integration/
```

Route files should continue using direct product paths such as `/login`, `/users/me`, `/crawl/pagespeed`, `/baselines`, and future paths like `/workspaces/{workspace_id}/tool-runs`. Do not add `/api/v1` prefixes unless the product intentionally adopts API versioning later.

## 4.1 Current backend baseline

The backend already includes:

- FastAPI app setup in `app/main.py`.
- CORS configuration.
- Request logging middleware.
- Security headers middleware.
- `/health` endpoint.
- MongoDB connection lifecycle in `app/core/db.py`.
- Settings in `app/core/config.py`.
- Direct route registration through `app/api/__init__.py`.
- JWT-based authenticated user dependency.
- Current admin dependency using `user.role == "admin"`.
- Authentication routes:
  - `/signup`
  - `/login`
  - `/logout`
  - `/auth/invitations/verify`
  - `/auth/set-password`
  - `/auth/forgot-password`
  - `/auth/reset-password`
- User profile routes:
  - `/users/me`
  - `/users/me/change-password`
- Admin user routes:
  - `/users`
  - `/users/invitations`
  - `/users/audit-logs`
  - `/users/{user_id}`
- Crawler/tool routes:
  - `/crawl`
  - `/crawl/pagespeed`
  - `/crawl/gtmetrix`
  - `/crawl/webpage`
  - `/crawl/pingdom`
  - `/crawl/ssllabs`
  - `/crawl/dnschecker`
  - `/crawl/websitepulse`
  - `/crawl/beacon`
  - `/crawl/catchpoint`
  - `/crawl/httpsecurityheaders`
  - `/crawl/silktide`
  - `/ocr/extract`
- Current baseline routes:
  - `POST /baselines`
  - `GET /baselines`
  - `GET /baselines/{baseline_id}`
  - `PATCH /baselines/{baseline_id}/status`
  - `DELETE /baselines/{baseline_id}`

The next backend plan should build on this working base and gradually evolve temporary direct tool execution into persistent jobs, artifacts, evidence, scopes, methodology, scores, and publications.

## 5. Layering rules

### API route layer

Routes should:

- Parse path/query/body inputs.
- Resolve authenticated user.
- Call service methods.
- Return response schemas.
- Avoid business logic.
- Avoid direct MongoDB access.

### Service layer

Services should:

- Own product behavior.
- Validate workflow transitions.
- Call permission checks.
- Call repositories.
- Create audit events.
- Schedule jobs.
- Enforce versioning rules.

### Repository layer

Repositories should:

- Own MongoDB queries.
- Keep collection-specific access in one place.
- Apply indexes-friendly filtering.
- Return raw or mapped documents consistently.
- Avoid product workflow decisions.

### Integration layer

Integrations should:

- Hide third-party client details.
- Normalize external responses.
- Keep secrets server-side.
- Return explicit success/failure objects.
- Avoid writing directly to product collections unless routed through services/jobs.

## 6. API response and error model

Use a consistent API envelope unless a streaming/download endpoint requires otherwise.

```py
class ApiResponse(BaseModel, Generic[T]):
    status: Literal["success", "error"]
    message: str
    data: T | None = None
```

Use a consistent error body:

```py
class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    message: str
    code: str | None = None
    field_errors: dict[str, list[str]] | None = None
    correlation_id: str | None = None
```

Status behavior:

| Status | Meaning |
|---|---|
| 400 | Bad operation request |
| 401 | Missing/invalid session |
| 403 | Authenticated but not allowed |
| 404 | Resource not found or not accessible |
| 409 | Revision conflict or invalid workflow transition |
| 422 | Request validation error |
| 429 | Rate limit or external tool quota |
| 500 | Unexpected server error |

## 7. MongoDB design principles

MongoDB is good for this product, but only with careful document boundaries.

Use separate collections for:

- Versioned records.
- Large operational histories.
- Tool runs.
- Artifacts.
- Evidence decisions.
- Audit events.

Avoid:

- One giant assessment document containing every run, artifact, baseline, score, report, and comment.
- Unbounded arrays that grow forever.
- Storing large HTML/PDF/raw tool payloads directly in core documents.
- Updating approved/published documents in place.

Preferred pattern:

```text
assessments
baseline_versions
baseline_sections
metric_scores
snapshot_versions
tool_runs
tool_artifacts
evidence_items
audit_events
```

## 8. Core collections

Initial collection list:

```text
users
organizations
workspaces
workspace_memberships
properties
competitors
discovery_jobs
discovered_pages
assessment_scopes
assessments
tool_catalog
tool_batches
tool_runs
tool_artifacts
extracted_measurements
evidence_items
evidence_decisions
methodologies
methodology_versions
metric_definitions
baseline_versions
baseline_sections
metric_scores
score_adjustments
snapshot_versions
trend_points
reviews
comments
reports
report_versions
render_jobs
publication_records
permission_groups
permission_assignments
audit_events
```

## 9. Document conventions

Every important document should include:

```py
{
  "_id": ObjectId,
  "created_at": datetime,
  "updated_at": datetime,
  "created_by": ObjectId | None,
  "updated_by": ObjectId | None,
  "deleted_at": datetime | None,
  "revision": str
}
```

Workspace-scoped documents should include:

```py
{
  "workspace_id": ObjectId,
  "organization_id": ObjectId
}
```

Versioned documents should include:

```py
{
  "version_number": int,
  "status": "draft" | "in_review" | "approved" | "published" | "superseded",
  "based_on_version_id": ObjectId | None,
  "locked_at": datetime | None,
  "locked_by": ObjectId | None
}
```

## 10. Authentication and permissions

Backend authorization is authoritative.

Frontend permission gating is for user experience only.

Permission keys should match the frontend plan:

```py
PermissionKey = Literal[
    "workspace.view",
    "workspace.manage",
    "discovery.run",
    "scope.approve",
    "tool.run",
    "evidence.review",
    "baseline.edit",
    "score.edit",
    "assessment.review",
    "report.edit",
    "report.publish",
    "methodology.manage",
    "users.manage",
    "permissions.manage",
    "audit.view",
]
```

Every protected service method should answer:

1. Who is acting?
2. What workspace/resource are they acting on?
3. What permission is required?
4. Is the resource still in a mutable state?
5. Should this action create an audit event?

## 11. Job architecture

Long-running work must not run inside request/response handlers.

Use background jobs for:

- Page discovery.
- Competitor discovery/suggestion.
- Tool batches.
- Artifact extraction.
- Baseline generation.
- Score recalculation.
- Snapshot generation.
- HTML/PDF report rendering.
- Bulk operations.

Standard job document:

```py
{
  "_id": ObjectId,
  "workspace_id": ObjectId,
  "job_type": str,
  "status": "queued" | "running" | "completed" | "partial" | "failed" | "cancelled",
  "progress": int | None,
  "attempt": int,
  "input": dict,
  "result": dict | None,
  "error": dict | None,
  "queued_at": datetime,
  "started_at": datetime | None,
  "completed_at": datetime | None
}
```

Job rules:

- Jobs must be idempotent where possible.
- Retried jobs must preserve previous attempts.
- External tool failures should not crash the entire batch unless required.
- Partial success must be represented explicitly.
- Job logs should be safe to expose based on permission.

## 12. Tool integration rules

Each tool integration should implement a shared interface:

```py
class ToolAdapter(Protocol):
    key: str

    async def run(self, input: ToolRunInput) -> ToolRunResult:
        ...
```

Tool output should be split into:

1. Raw response or artifact.
2. Normalized extracted measurements.
3. Evidence candidates.
4. Tool run status and metadata.

Do not let each tool write custom-shaped data directly into scoring collections.

## 13. Evidence model

Evidence is not the same thing as raw tool output.

Use this separation:

```text
tool_run
  -> raw artifact
  -> extracted measurement
  -> evidence candidate
  -> reviewed evidence item
  -> metric observation
  -> score
```

Evidence decisions should record:

- Accepted/rejected/replaced/manual.
- Reviewer.
- Timestamp.
- Reason/note.
- Linked artifact.
- Original extracted value.
- Replacement value when relevant.

## 14. Methodology and scoring

The methodology must be versioned.

An assessment should reference one exact methodology version. If admins change metric rules later, old assessments must still display the original logic.

Scoring rules:

- Backend calculates authoritative score values.
- Backend applies weights and formulas.
- Backend stores calculated score separately from analyst-adjusted score.
- Score adjustments require rationale.
- Blank, zero, not applicable, and not scored are distinct states.
- Published snapshots are immutable.

## 15. Baseline generation

Baseline generation should create a structured draft.

It should not create one giant HTML blob.

Baseline data should include:

- Version metadata.
- Section definitions.
- Finding blocks.
- Recommendations.
- Evidence references.
- Section status.
- Assignee/reviewer fields.
- Revision token.

Generation may use templates, rules, or approved AI workflows later, but the first implementation should be deterministic and evidence-led unless a separate AI workflow is approved.

## 16. Reports and publication

Report publication must freeze inputs.

A publication should reference:

- Workspace.
- Assessment.
- Baseline version.
- Snapshot version.
- Report version.
- Methodology version.
- Rendered HTML artifact.
- Rendered PDF artifact when available.

Published content cannot change in place. Corrections require a new version or superseding publication.

## 17. Audit strategy

Audit events should be created for:

- Login-sensitive events.
- Workspace membership changes.
- Permission changes.
- Discovery scope approval.
- Tool run retry/cancel.
- Evidence decisions.
- Methodology publish.
- Baseline submit/approve.
- Score adjustment.
- Snapshot generation/approval.
- Review approval/rejection.
- Report publication/supersede.

Audit event shape:

```py
{
  "_id": ObjectId,
  "organization_id": ObjectId | None,
  "workspace_id": ObjectId | None,
  "actor_id": ObjectId,
  "action": str,
  "resource_type": str,
  "resource_id": ObjectId | None,
  "metadata": dict,
  "created_at": datetime,
  "correlation_id": str | None
}
```

## 18. API design for frontend integration

The backend must provide frontend-ready APIs, not just raw database CRUD.

Every frontend page should have matching backend support:

- List endpoint.
- Detail endpoint.
- Create/update endpoints where applicable.
- Workflow action endpoints.
- Pagination/filtering.
- Permission-aware response behavior.
- Stable status values.
- Example payloads for frontend development.

For long-running operations, return job IDs immediately:

```json
{
  "status": "success",
  "message": "Tool batch queued",
  "data": {
    "job_id": "..."
  }
}
```

## 19. Indexing strategy

Create indexes early for expected access patterns.

Examples:

```text
workspaces: organization_id, slug
workspace_memberships: user_id, workspace_id
properties: workspace_id, normalized_domain
discovered_pages: workspace_id, property_id, canonical_url
tool_runs: workspace_id, assessment_id, page_id, tool_key, status, created_at
evidence_items: workspace_id, assessment_id, metric_id, status
baseline_versions: workspace_id, assessment_id, status, version_number
metric_scores: workspace_id, assessment_id, metric_id, subject_id
reviews: assignee_ids, status, workspace_id
audit_events: workspace_id, actor_id, action, created_at
```

Do not wait until production slowness to add basic indexes. Tiny dragons become big dragons, and MongoDB is very good at reminding you.

## 20. Testing strategy

### Unit tests

- Permission checks.
- Service workflow transitions.
- Scoring functions.
- Methodology validation.
- Evidence decision logic.
- Version conflict handling.

### Integration tests

- Authenticated API requests.
- Workspace access isolation.
- Discovery job creation.
- Tool run retry.
- Evidence accept/reject.
- Methodology publish validation.
- Baseline section update conflict.
- Report publication immutability.

### Job tests

- Successful job.
- Failed job.
- Partial job.
- Retry.
- Idempotency.
- Cancel behavior where supported.

### Contract tests

- API response shapes expected by frontend.
- Stable enum/status values.
- Error response format.

## 21. Security requirements

- Store secrets in environment/secret manager, not code.
- Hash passwords with approved password hashing.
- Keep JWT/session handling server-controlled.
- Validate workspace access on every scoped route.
- Validate file upload type and size.
- Sanitize any generated/rendered HTML.
- Use signed artifact URLs with expiration.
- Avoid leaking third-party raw logs to unauthorized users.
- Rate limit sensitive routes.
- Record permission changes in audit events.

## 22. Observability

Backend telemetry should include:

- Correlation ID per request.
- Structured route logs.
- API latency.
- Job duration.
- Tool integration failure category.
- MongoDB slow query logging.
- Error rate by endpoint.
- Artifact rendering failures.
- Review/publication state transitions.

Do not log confidential raw evidence, secrets, tokens, or full third-party responses.

## 23. First backend implementation sprint

### Sprint goal

Create the backend foundation and workspace APIs needed by the first frontend implementation phase.

### Tasks

1. Create FastAPI app structure.
2. Add configuration management.
3. Add MongoDB connection.
4. Add health/readiness endpoints.
5. Add standard response/error models.
6. Add correlation ID middleware.
7. Add user/session dependency placeholder or real auth integration.
8. Add workspace collections and indexes.
9. Add workspace schemas.
10. Add workspace repository.
11. Add workspace service.
12. Add workspace routes.
13. Add effective permissions endpoint.
14. Add audit event service.
15. Add tests for workspace list/detail/create and access denial.

### Sprint file target

```text
app/main.py
app/api/__init__.py
app/api/routes/workspace_routes.py
app/core/
app/db/
app/schemas/workspace.py
app/repositories/workspaces.py
app/services/workspace_service.py
app/permissions/
app/audit/
app/tests/
```

## 24. Definition of done

A backend feature is complete only when:

- It has clear schemas.
- It has service-layer logic.
- It has repository access isolated from routes.
- It validates permissions.
- It records audit events for important mutations.
- It has tests for success and failure paths.
- It returns frontend-ready response shapes.
- It handles `401`, `403`, `404`, `409`, and validation errors correctly.
- It avoids storing secrets or large blobs in core documents.
- It has indexes for expected query patterns.
- It documents job behavior where relevant.
