# Proposed API Contracts

These contracts are designed for frontend-first development. They should be
implemented as TypeScript types and Zod schemas, then reused by mock and real API
adapters.

## 1. Common Types

```ts
type ID = string;
type ISODateTime = string;

type JobState =
  | "draft"
  | "queued"
  | "running"
  | "waiting_for_input"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled"
  | "superseded";

type ReportRunStage =
  | "configuration"
  | "tools"
  | "baseline"
  | "snapshots"
  | "assessment"
  | "preview"
  | "review"
  | "published";
```

## 2. Core Entities

```ts
interface Organization {
  id: ID;
  name: string;
  slug: string;
  createdAt: ISODateTime;
}

interface UserSummary {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Membership {
  organizationId: ID;
  userId: ID;
  role: "platform_admin" | "organization_admin" | "analyst" | "reviewer" | "client_viewer";
  capabilities: string[];
}

interface ClientWorkspace {
  id: ID;
  organizationId: ID;
  name: string;
  slug: string;
  industryProfileId: ID;
  primaryDomain: string;
  domains: string[];
  status: "active" | "archived";
  owner: UserSummary;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Engagement {
  id: ID;
  workspaceId: ID;
  name: string;
  status: "draft" | "active" | "completed" | "archived";
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
}

interface ReportRun {
  id: ID;
  engagementId: ID;
  workspaceId: ID;
  label: string;
  currentStage: ReportRunStage;
  status: JobState;
  configuration: ReportRunConfiguration;
  createdBy: UserSummary;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

## 3. Run Configuration

```ts
interface ReportRunConfiguration {
  primaryDomain: string;
  additionalDomains: string[];
  competitors: Array<{
    name: string;
    domains: string[];
  }>;
  geography: string[];
  industryProfileId: ID;
  toolIds: ID[];
  reportTemplateIds: ID[];
  requestedSnapshotTypes: Array<"health" | "competitive" | "trend">;
}
```

## 4. Jobs

```ts
interface GenerationJob {
  id: ID;
  runId: ID;
  type: "tools" | "baseline" | "snapshot" | "assessment" | "export";
  state: JobState;
  stageLabel: string;
  progress?: {
    current: number;
    total: number;
    percent?: number;
  };
  requiredAction?: {
    code: string;
    title: string;
    description: string;
    actionUrl: string;
  };
  error?: {
    code: string;
    message: string;
    correlationId: string;
    retryable: boolean;
  };
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
  updatedAt: ISODateTime;
}
```

## 5. Tool Runs

```ts
interface ToolRun {
  id: ID;
  jobId: ID;
  toolId: ID;
  toolName: string;
  state: JobState;
  artifactCount: number;
  summary?: string;
  waiver?: {
    reason: string;
    waivedBy: UserSummary;
    waivedAt: ISODateTime;
  };
  error?: GenerationJob["error"];
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
}
```

## 6. Baseline

```ts
interface Baseline {
  id: ID;
  runId: ID;
  version: number;
  status: "draft" | "validating" | "ready" | "locked";
  coveragePercent: number;
  metrics: BaselineMetric[];
  issues: ValidationIssue[];
  lockedBy?: UserSummary;
  lockedAt?: ISODateTime;
}

interface BaselineMetric {
  id: ID;
  key: string;
  label: string;
  value: unknown;
  unit?: string;
  confidence: "low" | "medium" | "high";
  sourceCount: number;
}

interface ValidationIssue {
  id: ID;
  severity: "info" | "warning" | "error";
  code: string;
  title: string;
  description: string;
  status: "open" | "resolved" | "waived";
  resourceType: string;
  resourceId: ID;
}
```

## 7. Snapshots and Assessments

```ts
interface Snapshot {
  id: ID;
  runId: ID;
  baselineId: ID;
  type: "health" | "competitive" | "trend";
  status: JobState;
  capturedAt: ISODateTime;
  version: number;
}

interface Assessment {
  id: ID;
  runId: ID;
  status: "draft" | "in_review" | "changes_requested" | "approved" | "published";
  version: number;
  pages: ReportPageSummary[];
  validationIssues: ValidationIssue[];
  updatedAt: ISODateTime;
}

interface ReportPageSummary {
  id: ID;
  assessmentId: ID;
  templateId: string;
  title: string;
  slug: string;
  order: number;
  group?: string;
  visibility: "internal" | "client";
  generationState: JobState;
  status: "draft" | "needs_review" | "approved" | "published";
  version: number;
  updatedAt: ISODateTime;
}
```

`Assessment.pages` is an ordered collection with no fixed maximum. The frontend
and backend must not assume an assessment contains exactly three pages.

## 8. Suggested Endpoints

```text
GET    /api/session
GET    /api/organizations
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:workspaceId
POST   /api/workspaces/:workspaceId/engagements

POST   /api/engagements/:engagementId/runs
GET    /api/runs/:runId
PATCH  /api/runs/:runId/configuration

POST   /api/runs/:runId/jobs/tools
POST   /api/runs/:runId/jobs/baseline
POST   /api/runs/:runId/jobs/snapshots
POST   /api/runs/:runId/jobs/assessment
GET    /api/runs/:runId/jobs
POST   /api/jobs/:jobId/retry
POST   /api/jobs/:jobId/cancel

GET    /api/runs/:runId/baseline
POST   /api/baselines/:baselineId/issues/:issueId/resolve
POST   /api/baselines/:baselineId/lock

GET    /api/runs/:runId/snapshots
GET    /api/runs/:runId/assessment
POST   /api/assessments/:assessmentId/pages
PATCH  /api/assessments/:assessmentId/pages/order
GET    /api/report-pages/:pageId
PATCH  /api/report-pages/:pageId/content
PATCH  /api/report-pages/:pageId
POST   /api/report-pages/:pageId/regenerate
POST   /api/report-pages/:pageId/duplicate
DELETE /api/report-pages/:pageId
POST   /api/assessments/:assessmentId/submit-review
POST   /api/assessments/:assessmentId/request-changes
POST   /api/assessments/:assessmentId/approve
POST   /api/assessments/:assessmentId/publish

GET    /api/notifications
POST   /api/notifications/:notificationId/read
GET    /api/events
```

## 9. Job Event Stream

Use Server-Sent Events initially:

```text
GET /api/events?organizationId=:organizationId
```

Example event:

```json
{
  "id": "evt_01J...",
  "type": "job.updated",
  "createdAt": "2026-06-11T10:30:00Z",
  "organizationId": "org_1",
  "workspaceId": "ws_lysol",
  "runId": "run_june_2026",
  "jobId": "job_tools_1",
  "payload": {
    "state": "running",
    "stageLabel": "Running accessibility scan",
    "progress": {
      "current": 4,
      "total": 8,
      "percent": 50
    }
  }
}
```

Event types:

```text
job.created
job.updated
job.completed
job.failed
job.waiting_for_input
baseline.ready
snapshot.ready
assessment.ready
assessment.changes_requested
assessment.approved
report.published
notification.created
```

## 10. Example Report Run Response

```json
{
  "id": "run_june_2026",
  "workspaceId": "ws_lysol",
  "engagementId": "eng_june_2026",
  "label": "June 2026 Digital Assessment",
  "currentStage": "tools",
  "status": "running",
  "configuration": {
    "primaryDomain": "lysol.com",
    "additionalDomains": [],
    "competitors": [
      { "name": "Clorox Portfolio", "domains": ["clorox.com"] },
      { "name": "Seventh Generation", "domains": ["seventhgeneration.com"] },
      { "name": "P&G Home Care", "domains": ["pg.com"] }
    ],
    "geography": ["US"],
    "industryProfileId": "cpg_household_brand",
    "toolIds": ["pagespeed", "accessibility", "seo", "security"],
    "reportTemplateIds": [
      "digital-health-assessment.v1",
      "competitive-position-report.v1",
      "competitive-signal-dashboard.v1"
    ],
    "requestedSnapshotTypes": ["health", "competitive"]
  },
  "createdBy": {
    "id": "user_1",
    "name": "Analyst",
    "email": "analyst@example.com"
  },
  "createdAt": "2026-06-11T09:00:00Z",
  "updatedAt": "2026-06-11T10:30:00Z"
}
```

## 11. API Error Shape

All errors should use one predictable structure:

```json
{
  "error": {
    "code": "BASELINE_NOT_LOCKED",
    "message": "Lock the baseline before generating the assessment.",
    "correlationId": "req_01J...",
    "fieldErrors": {
      "baselineId": ["A locked baseline is required."]
    }
  }
}
```
