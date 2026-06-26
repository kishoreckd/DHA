# DHA React TypeScript Frontend Implementation Blueprint

This document describes how to build the DHA Digital Assessment Platform as a clean React TypeScript application.

The frontend target is:

- React
- TypeScript
- React Router
- TanStack Query
- React Hook Form
- Zod
- Vite or equivalent React build tooling
- Python/FastAPI backend
- MongoDB-backed backend APIs

This is not a Next.js implementation plan.

## 1. Senior frontend approach

The app should be built as an operational product, not as a collection of screens.

The important engineering decisions are:

1. Keep pages simple and route-driven.
2. Put product logic inside feature modules.
3. Keep shared UI generic.
4. Keep backend API calls outside visual components.
5. Keep server-state in TanStack Query.
6. Keep form-state in React Hook Form.
7. Keep global client-state minimal.
8. Build every screen with loading, empty, error, denied, stale, and partial states.
9. Treat long-running work as backend jobs.
10. Never mutate approved or published versions in-place.
11. Every real product page must be connected to backend APIs through typed API services and TanStack Query hooks.

### Implementation discipline and anti-hallucination rules

When implementing from this plan, do not invent product behavior from general knowledge or assumptions. Use only:

- The approved frontend planning documents.
- The agreed backend API contracts.
- The current design system and component conventions.
- Explicit user/admin requirements.
- Real response data returned by the backend.

Do not hallucinate missing flows, fields, statuses, metrics, formulas, permissions, or report sections. If a required backend contract or product rule is missing, create a typed placeholder only when needed for UI scaffolding and clearly mark it as temporary.

The frontend must not implement authoritative business logic that belongs to the backend. In particular, do not calculate final scores, metric weights, methodology formulas, competitor rankings, publication eligibility, permission decisions, or tool-run results in the browser. The frontend may format, preview, filter, group, and display backend-provided values, but the backend remains the source of truth.

Do not add explanatory text to every container/card/panel just to describe what it does. Use clean titles, labels, actions, empty states, and contextual helper text only where it genuinely helps the user make a decision. The UI should feel professional and operational, not like every box is narrating itself.

If the implementation is uncertain, prefer a small, typed, clearly named UI skeleton over invented logic.

### API integration rule for every page

Every page in this product is expected to be API-integrated. Do not build final pages with hardcoded static data.

Each page should have:

- A typed API service function.
- A TanStack Query hook for reading data.
- A mutation hook for create/update/delete/workflow actions.
- Loading, empty, error, denied, and success states.
- Backend `403`, `404`, `409`, `422`, and `500` handling where relevant.
- Query invalidation after successful mutations.
- Temporary mock data only when the backend contract is not ready, and it must be clearly named as mock/dev-only.

Recommended page implementation flow:

```text
Page route
  -> reads route params and URL filters
  -> calls feature query hook
  -> renders page states
  -> passes real API data into feature components
  -> uses mutation hooks for actions
  -> invalidates/refetches affected queries
```

Static placeholder screens are allowed only during scaffolding. Before a phase is considered complete, all pages in that phase must use real backend contracts or an explicitly approved temporary adapter.

## 2. UI experience direction

The UI should feel like a premium enterprise intelligence product: clean, confident, sharp, and operational. It should not feel like a basic CRUD dashboard or a generic admin template.

Use these experience keywords while designing screens:

- Premium
- Clean
- Calm
- Sharp
- Trustworthy
- Modern
- Executive-ready
- Analyst-friendly
- Data-rich
- Dense but breathable
- Guided
- Structured
- Fast
- Professional
- Minimal noise
- Clear hierarchy
- Strong status visibility
- Confident empty states
- Polished workflow

The product should feel like a control room for digital assessment work. Users should immediately understand:

- What client/workspace they are inside.
- What assessment period they are working on.
- What stage the assessment is in.
- What is complete.
- What is blocked.
- What needs review.
- What can be published.
- What changed since the last version.

### Visual style expectations

The preferred visual style is modern enterprise SaaS:

- Spacious page shells.
- Strong but subtle card boundaries.
- Clean typography.
- Clear page titles and section hierarchy.
- Muted neutral backgrounds.
- Purposeful accent colors.
- Status badges that are easy to scan.
- Tables that feel powerful, not cramped.
- Drawers for focused editing.
- Side panels for context and evidence.
- Sticky action bars where workflows are long.
- Polished loading skeletons.
- Useful empty states.
- Crisp icons used only where they improve scanning.

Avoid:

- Overly playful visuals.
- Random gradients.
- Too many colors.
- Heavy shadows everywhere.
- Decorative UI that does not help the workflow.
- Cards inside cards inside cards.
- Large blocks of explanation text.
- Generic template-looking admin screens.

### Screen personality by module

Each product area should have a slightly different UI personality while still feeling like one product.

| Area | UI personality |
|---|---|
| Dashboard | Executive command center, high-signal, action-focused |
| Workspaces | Clean client portfolio, easy to scan, calm hierarchy |
| Discovery | Guided setup flow, confidence-building, clear progress |
| Tool runs | Operational control room, status-heavy, retry-friendly |
| Evidence | Analyst workbench, side-by-side proof, decision-focused |
| Methodology admin | Precise configuration console, validation-first |
| Baseline | Structured writing workspace, focused, version-aware |
| Scoring | Dense analytical grid, comparison-friendly, careful with states |
| Snapshot | Executive summary, visual, trend-aware, boardroom-ready |
| Review | Collaboration queue, comments, decisions, accountable actions |
| Reports | Publishing studio, polished preview, careful confirmation |
| Permissions | Enterprise control panel, explicit, safe, auditable |

### UI component tone

Components should be clear and polished:

- Buttons should use direct action labels: `Run discovery`, `Approve scope`, `Retry failed runs`, `Generate baseline`, `Submit for review`.
- Empty states should explain the next action, not the whole product.
- Error states should be calm, specific, and recoverable.
- Badges should use consistent labels and colors.
- Tables should prioritize scan speed.
- Forms should feel guided but not noisy.
- Dialogs should be used for decisions with consequences.
- Drawers should be used for editing or inspecting contextual details.
- Toasts should confirm short-lived actions, not replace page state.

### Layout principles

Use a consistent page rhythm:

```text
Breadcrumbs
Page title and status
Primary action group
Important warnings/blockers
Tabs or workflow stepper
Main working area
Context side panel when needed
Activity/version metadata
```

The best screens should feel “quiet but powerful”. The user should not need to read a lot to know what to do next.

### UX quality bar

Every important page should answer these questions visually:

1. Where am I?
2. What is the current status?
3. What needs attention?
4. What can I do next?
5. What is blocked and why?
6. What changed recently?
7. What evidence supports this?

If a screen cannot answer those questions, it is not done.

## 3. Target architecture

```text
Browser
  |
  v
React TypeScript SPA
  |
  +-- React Router pages
  +-- Feature modules
  +-- Shared UI/components
  +-- TanStack Query hooks
  |
  v
Typed API services
  |
  v
FastAPI backend
  |
  +-- MongoDB
  +-- job workers
  +-- third-party tool integrations
  +-- artifact storage
```

The browser must never receive third-party tool credentials, storage credentials, crawler keys, or backend service secrets.

## 4. Recommended folder structure

Use a clear `pages + features + shared + types` structure.

```text
src/
  app/
    App.tsx
    router.tsx
    providers/
      AppProviders.tsx
      QueryProvider.tsx
      AuthProvider.tsx
    layouts/
      PublicLayout.tsx
      AuthenticatedLayout.tsx
      WorkspaceLayout.tsx
      AdminLayout.tsx

  pages/
    auth/
      LoginPage.tsx
      ForgotPasswordPage.tsx
      ResetPasswordPage.tsx
    dashboard/
      DashboardPage.tsx
    workspaces/
      WorkspacesListPage.tsx
      WorkspaceCreatePage.tsx
      WorkspaceOverviewPage.tsx
      WorkspaceSettingsPage.tsx
      WorkspaceMembersPage.tsx
    properties/
      PropertiesListPage.tsx
      PropertyDetailPage.tsx
    discovery/
      DiscoveryPage.tsx
      ScopeReviewPage.tsx
    competitors/
      CompetitorsPage.tsx
    tools/
      ToolsCatalogPage.tsx
      ToolRunsPage.tsx
      ToolRunDetailPage.tsx
    assessments/
      AssessmentsPage.tsx
      AssessmentCreatePage.tsx
      AssessmentOverviewPage.tsx
    evidence/
      EvidenceReviewPage.tsx
      EvidenceDetailPage.tsx
    baseline/
      BaselinePage.tsx
      BaselineSectionPage.tsx
    scoring/
      ScoresPage.tsx
    snapshots/
      SnapshotPage.tsx
      TrendsPage.tsx
    reviews/
      ReviewsInboxPage.tsx
      ReviewDetailPage.tsx
    reports/
      ReportsPage.tsx
      ReportDetailPage.tsx
      ReportEditorPage.tsx
      ReportPreviewPage.tsx
    publications/
      PublicationViewPage.tsx
    admin/
      users/
      methodologies/
      tools/
      permissions/
      audit/
    errors/
      UnauthorizedPage.tsx
      NotFoundPage.tsx

  features/
    auth/
    users/
    dashboard/
    workspaces/
    properties/
    discovery/
    competitors/
    scope/
    tools/
    assessments/
    evidence/
    methodologies/
    metrics/
    baseline/
    scoring/
    snapshots/
    trends/
    reviews/
    comments/
    reports/
    publications/
    permissions/
    audit/

  shared/
    api/
      client.ts
      errors.ts
      queryKeys.ts
      pagination.ts
    components/
      buttons/
      data-table/
      dialogs/
      drawers/
      feedback/
      forms/
      layout/
      navigation/
      status/
    config/
      env.ts
      routes.ts
    hooks/
      useDebouncedValue.ts
      useDocumentTitle.ts
      usePermission.ts
      useUrlFilters.ts
    lib/
      date.ts
      format.ts
      permissions.ts
      score.ts
      validation.ts
    telemetry/
      trackEvent.ts
      trackError.ts
    types/
      api.ts
      common.ts

  types/
    auth.ts
    workspace.ts
    property.ts
    discovery.ts
    competitor.ts
    scope.ts
    tools.ts
    assessment.ts
    evidence.ts
    methodology.ts
    metric.ts
    baseline.ts
    scoring.ts
    snapshot.ts
    review.ts
    report.ts
    publication.ts
    permissions.ts

  test/
    setup.ts
    factories/
    mocks/
```

## 5. Feature module structure

Each feature should be predictable.

```text
src/features/workspaces/
  api.ts
  hooks.ts
  types.ts
  schema.ts
  utils.ts
  components/
    WorkspaceCard.tsx
    WorkspaceHeader.tsx
    WorkspaceSwitcher.tsx
    WorkspaceCreateForm.tsx
  __tests__/
    WorkspaceCreateForm.test.tsx
```

### What belongs where

| Area | Belongs in |
|---|---|
| Route components | `src/pages` |
| API calls | `feature/api.ts` or `shared/api` |
| Query/mutation hooks | `feature/hooks.ts` |
| Reusable feature UI | `feature/components` |
| Cross-feature UI | `shared/components` |
| Backend DTO/domain types | `src/types` |
| Form schemas | `feature/schema.ts` |
| Generic utilities | `shared/lib` |
| Route path constants | `shared/config/routes.ts` |

## 6. Routing design

Use React Router nested routes.

```tsx
createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <AuthenticatedLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/workspaces", element: <WorkspacesListPage /> },
      { path: "/workspaces/new", element: <WorkspaceCreatePage /> },
      {
        path: "/workspaces/:workspaceId",
        element: <WorkspaceLayout />,
        children: [
          { index: true, element: <WorkspaceOverviewPage /> },
          { path: "discovery", element: <DiscoveryPage /> },
          { path: "tools", element: <ToolsCatalogPage /> },
          { path: "tool-runs", element: <ToolRunsPage /> },
          { path: "reports", element: <ReportsPage /> },
        ],
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { path: "users", element: <AdminUsersPage /> },
          { path: "methodologies", element: <MethodologiesPage /> },
          { path: "permissions", element: <PermissionsPage /> },
        ],
      },
    ],
  },
]);
```

Route files should not contain heavy product logic. A page should compose feature components and hooks.

## 7. API client pattern

Create one backend client wrapper.

```ts
export type ApiResponse<T> = {
  status: "success" | "error";
  message: string;
  data: T | null;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AppError = {
  status: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  correlationId?: string;
};
```

Expected error behavior:

| Status | Frontend behavior |
|---|---|
| 400/422 | Show form or operation validation errors |
| 401 | Clear session and move user to login |
| 403 | Show access denied, do not clear session |
| 404 | Show not-found or resource-missing state |
| 409 | Show version conflict dialog |
| 429 | Show rate limit message and retry timing |
| 500+ | Show safe message with correlation ID |

## 8. Query key convention

Every query key should be centralized and stable.

```ts
export const queryKeys = {
  currentUser: ["current-user"] as const,

  workspaces: {
    all: ["workspaces"] as const,
    list: (filters: WorkspaceFilters) => ["workspaces", "list", filters] as const,
    detail: (workspaceId: string) => ["workspaces", "detail", workspaceId] as const,
    permissions: (workspaceId: string) =>
      ["workspaces", "permissions", workspaceId] as const,
  },

  toolRuns: {
    list: (workspaceId: string, filters: ToolRunFilters) =>
      ["tool-runs", workspaceId, filters] as const,
    detail: (runId: string) => ["tool-runs", "detail", runId] as const,
  },
};
```

Mutation rules:

- Invalidate only affected queries.
- Avoid full-app invalidation.
- Use optimistic updates only for safe UI operations.
- Never optimistically approve, publish, or delete important records.

## 9. Core domain types

These are initial frontend contracts. Final names should match backend API contracts.

### Workspace

```ts
export type Workspace = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  status: "active" | "archived";
  primaryDomain: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionKey[];
};
```

### Property

```ts
export type Property = {
  id: string;
  workspaceId: string;
  name: string;
  primaryUrl: string;
  normalizedDomain: string;
  status: "active" | "inactive" | "archived";
  createdAt: string;
  updatedAt: string;
};
```

### Assessment

```ts
export type Assessment = {
  id: string;
  workspaceId: string;
  propertyId: string;
  title: string;
  periodType: "weekly" | "monthly" | "quarterly" | "custom";
  periodStart: string;
  periodEnd: string;
  methodologyVersionId: string;
  status:
    | "draft"
    | "collecting"
    | "evidence_review"
    | "baseline"
    | "scoring"
    | "review"
    | "approved"
    | "published"
    | "archived";
  ownerId: string;
  competitorIds: string[];
  pageIds: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Assessment page

```ts
export type AssessmentPage = {
  id: string;
  propertyId: string;
  url: string;
  canonicalUrl: string | null;
  title: string | null;
  pageType:
    | "homepage"
    | "pdp"
    | "plp"
    | "landing"
    | "article"
    | "search"
    | "conversion"
    | "support"
    | "other";
  source: "sitemap" | "crawl" | "analytics" | "search_console" | "manual";
  scopeStatus: "suggested" | "selected" | "excluded";
};
```

### Tool run

```ts
export type ToolRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled"
  | "stale";

export type ToolRun = {
  id: string;
  workspaceId: string;
  assessmentId: string | null;
  pageId: string;
  toolKey: string;
  status: ToolRunStatus;
  freshness: "fresh" | "aging" | "stale";
  attempt: number;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  progress: number | null;
  statusMessage: string | null;
  artifacts: ArtifactSummary[];
  canRetry: boolean;
};
```

### Evidence

```ts
export type EvidenceItem = {
  id: string;
  assessmentId: string;
  metricId: string | null;
  pageId: string | null;
  toolRunId: string | null;
  sourceType: "tool" | "manual" | "imported";
  label: string;
  value: unknown;
  unit: string | null;
  status: "unreviewed" | "accepted" | "rejected" | "superseded";
  sufficiency: "sufficient" | "partial" | "missing" | "not_applicable";
  artifactIds: string[];
  reviewerId: string | null;
  reviewedAt: string | null;
};
```

### Metric score

```ts
export type MetricScore = {
  metricId: string;
  subjectId: string;
  subjectType: "client" | "competitor";
  calculatedScore: number | null;
  finalScore: number | null;
  scoreSource: "calculated" | "adjusted" | "manual" | "not_scored";
  completeness: number;
  rationale: string | null;
  evidenceIds: string[];
  updatedAt: string;
};
```

## 10. Permission model

Do not build new screens with role-only checks like this:

```ts
user.role === "admin";
```

Use effective permissions:

```ts
export type PermissionKey =
  | "workspace.view"
  | "workspace.manage"
  | "discovery.run"
  | "scope.approve"
  | "tool.run"
  | `tool.${string}.run`
  | "evidence.review"
  | "baseline.edit"
  | "score.edit"
  | "assessment.review"
  | "report.edit"
  | "report.publish"
  | "methodology.manage"
  | "users.manage"
  | "permissions.manage"
  | "audit.view";
```

Frontend behavior:

- Hide navigation the user cannot access.
- Disable contextually blocked actions with a reason.
- Show access-denied pages for restricted routes.
- Still handle backend `403` as authoritative.

## 11. Page implementation pattern

A page should normally look like this:

```tsx
export function ToolRunsPage() {
  const { workspaceId } = useWorkspaceParams();
  const filters = useToolRunFiltersFromUrl();
  const permissions = useWorkspacePermissions(workspaceId);
  const runsQuery = useToolRuns(workspaceId, filters);

  if (!permissions.canViewToolRuns) return <AccessDenied />;
  if (runsQuery.isLoading) return <PageLoader label="Loading tool runs" />;
  if (runsQuery.isError) return <PageError error={runsQuery.error} />;

  return (
    <ToolRunsView
      runs={runsQuery.data.items}
      filters={filters}
      canRetry={permissions.canRunTools}
    />
  );
}
```

Keep pages readable. If the page is hard to scan, the logic belongs in a hook or feature component.

## 12. Data-table standard

Operational pages need consistent table behavior.

Every major list should support:

- Search.
- Filters.
- Sorting.
- Pagination.
- URL-synced filters.
- Empty state.
- No-results state.
- Loading skeleton.
- Error state.
- Column labels that match product vocabulary.
- Bulk actions only when backend supports safe job-based processing.

Large tables should eventually use virtualization.

## 13. Long-running job UX

Tool sync, discovery, PDF rendering, baseline generation, snapshot generation, and bulk operations are jobs.

Preferred live update order:

1. Server-Sent Events.
2. TanStack Query polling.
3. Manual refresh fallback.

Polling rules:

- Poll active jobs every 2 to 5 seconds.
- Stop when jobs reach terminal states.
- Slow down when browser tab is hidden.
- Refetch when window is focused.
- Preserve previous data to prevent UI flicker.

Never infer completion from elapsed time.

## 14. Versioning and concurrency

Editable versioned records must include a revision value.

```ts
export type VersionReference = {
  id: string;
  versionNumber: number;
  status: "draft" | "in_review" | "approved" | "published" | "superseded";
  revision: string;
  createdAt: string;
  createdBy: string;
  basedOnVersionId: string | null;
};
```

Update payloads should include expected revision:

```ts
export type UpdateVersionRequest<T> = {
  revision: string;
  changes: T;
};
```

On `409 Conflict`, show:

- What changed.
- Who changed it when available.
- Reload option.
- Compare option when available.
- Copy unsaved text option for editors.

Do not silently overwrite another analyst's work.

## 15. Baseline editor design

The baseline should not be one uncontrolled HTML blob.

Use structured blocks:

```ts
export type FindingBlock = {
  id: string;
  title: string;
  findingType: "strength" | "gap" | "risk" | "opportunity";
  severity: "low" | "medium" | "high" | "critical" | null;
  summary: string;
  detail: string;
  recommendation: string;
  affectedPageIds: string[];
  competitorIds: string[];
  evidenceIds: string[];
  ownerId: string | null;
  status: "draft" | "ready" | "needs_evidence" | "resolved";
};
```

Suggested layout:

```text
Left: section navigation
Center: section editor and finding blocks
Right: evidence, comments, status, assignment
```

Autosave rules:

- Save after a short idle period.
- Show saving/saved/error state.
- Keep local unsaved changes after transient failure.
- Warn before leaving with unsaved changes.
- Use revision-aware updates.
- Do not autosave approval or publication actions.

## 16. Scoring and snapshot design

The 68 metrics are too dense for a naive table.

Desktop:

- Paginated or virtualized metric table.
- Sticky metric column.
- Subject columns for client and competitors.
- Expandable rationale.
- Evidence drawer.
- Formula drawer.

Tablet/mobile:

- Metric cards.
- Subject tabs.
- Filter drawer.

Important states:

- `0` score
- blank score
- not applicable
- not scored yet
- calculated score
- adjusted score
- manual score

These must not look the same.

## 17. Report and publication design

The frontend should compose report data. The backend should render authoritative HTML/PDF artifacts.

Frontend responsibilities:

- Select included sections.
- Reorder sections.
- Edit narrative fields.
- Preview server-rendered HTML.
- Request PDF generation.
- Display render status.
- Publish frozen version.
- Supersede old publication.

Do not generate authoritative PDF files fully in the browser.

## 18. Shared component list

Build these once and reuse heavily:

- `PageLoader`
- `PageError`
- `EmptyState`
- `AccessDenied`
- `StatusBadge`
- `VersionBadge`
- `FreshnessBadge`
- `ScoreBadge`
- `ProgressSummary`
- `DataTable`
- `TableToolbar`
- `FilterBar`
- `ConfirmDialog`
- `FormDrawer`
- `ActivityTimeline`
- `ArtifactLink`
- `EvidenceReference`
- `CompletenessMeter`
- `WorkflowStepper`
- `PermissionGate`
- `UnsavedChangesGuard`

Color must never be the only status indicator.

## 19. Phase-by-phase implementation folders

### Phase 0

```text
src/app/
src/shared/api/
src/shared/components/
src/shared/lib/
src/test/
```

### Phase 1

```text
src/pages/workspaces/
src/features/workspaces/
src/types/workspace.ts
src/types/permissions.ts
```

### Phase 2

```text
src/pages/properties/
src/pages/discovery/
src/pages/competitors/
src/features/properties/
src/features/discovery/
src/features/competitors/
src/features/scope/
```

### Phase 3

```text
src/pages/tools/
src/features/tools/
src/types/tools.ts
```

### Phase 4

```text
src/pages/admin/methodologies/
src/pages/admin/tools/
src/features/methodologies/
src/features/metrics/
```

### Phase 5

```text
src/pages/evidence/
src/features/evidence/
```

### Phase 6

```text
src/pages/assessments/
src/pages/baseline/
src/features/assessments/
src/features/baseline/
```

### Phase 7

```text
src/pages/scoring/
src/pages/snapshots/
src/features/scoring/
src/features/snapshots/
src/features/trends/
```

### Phase 8

```text
src/pages/reviews/
src/features/reviews/
src/features/comments/
src/features/activity/
```

### Phase 9

```text
src/pages/reports/
src/pages/publications/
src/features/reports/
src/features/publications/
```

### Phase 10

```text
src/pages/admin/permissions/
src/pages/admin/audit/
src/features/permissions/
src/features/audit/
```

## 20. Testing strategy

### Unit tests

- Permission helpers.
- Query-key factories.
- Formatters.
- Validation schemas.
- Workflow transition helpers.
- Score display helpers.

### Component tests

- Forms.
- Table filters.
- Permission-gated actions.
- Job status rendering.
- Baseline section editor.
- Score adjustment drawer.
- Review approval actions.

### Integration tests

- API error handling.
- Session expiration.
- `403`, `409`, `422`, and `429` handling.
- Polling lifecycle.
- Artifact authorization failures.

### End-to-end tests

1. Admin creates workspace and assigns user.
2. Analyst enters URL and approves scope.
3. Analyst runs tools and retries failure.
4. Analyst reviews evidence.
5. Analyst generates baseline.
6. Analyst generates snapshot.
7. Reviewer approves.
8. Publisher publishes report.
9. Unauthorized user is denied.

Avoid live third-party tools in normal CI. Use deterministic backend fixtures or a dedicated test environment.

## 21. Accessibility requirements

- WCAG 2.1 AA minimum.
- Keyboard-operable tables, dialogs, tabs, editors, and menus.
- Visible focus states.
- Correct heading hierarchy.
- Labels for every form control.
- Screen-reader announcements for job progress and autosave.
- Accessible chart summaries.
- No meaning communicated by color alone.
- Focus restoration after dialogs and drawers close.

## 22. Performance requirements

- Lazy-load heavy editors and chart libraries.
- Use pagination or virtualization for large tables.
- Keep filters in URL query parameters without full reload.
- Use backend summaries for dashboard counts.
- Use thumbnails or signed preview URLs for artifacts.
- Avoid downloading full raw tool outputs in list pages.
- Memoize expensive table column definitions.

## 23. Security requirements

- Keep JWT/session tokens in HTTP-only cookies where possible.
- Never expose crawler/tool credentials.
- Sanitize server-rendered or user-authored HTML before display.
- Avoid raw `dangerouslySetInnerHTML` unless approved sanitizer is used.
- Use authorized artifact URLs.
- Validate upload type/size server-side.
- Prevent open redirects.
- Do not expose internal logs to users without permission.

## 24. Observability

Track:

- Route errors.
- API latency and failures.
- Job start/retry/cancel.
- Autosave failures.
- Version conflicts.
- Report-render failures.
- Publication events.
- Backend correlation IDs.

Do not send confidential assessment content, raw evidence, or artifact values to analytics tools.

## 25. First implementation sprint

The first sprint should not jump directly into the big baseline editor. Start with the foundation that lets the rest stay clean.

### Sprint goal

Create the React TypeScript application foundation and workspace-aware shell.

### Tasks

1. Confirm React/Vite app setup.
2. Add `src/app/router.tsx`.
3. Add `AppProviders`.
4. Add API client and error normalization.
5. Add query key factory.
6. Add shared page-state components.
7. Add permission helpers and `PermissionGate`.
8. Add workspace types.
9. Add workspace API service.
10. Add workspace query hooks.
11. Add workspaces list page.
12. Add workspace detail layout.
13. Add workspace switcher.
14. Add tests for workspace routing and permission states.

### Sprint file target

```text
src/app/
  App.tsx
  router.tsx
  providers/
  layouts/

src/shared/
  api/
  components/feedback/
  components/navigation/
  lib/permissions.ts

src/pages/workspaces/

src/features/workspaces/

src/types/
  workspace.ts
  permissions.ts
```

## 26. Definition of done

A frontend feature is complete only when:

- It has real backend integration or a clearly marked temporary mock adapter.
- Types match agreed API contracts.
- Loading, empty, error, partial, denied, and success states exist.
- Permissions are applied.
- Backend denial is handled.
- Mutations prevent duplicate submission.
- Query invalidation is scoped.
- Keyboard behavior is verified.
- Responsive behavior is verified.
- Tests cover main success and failure paths.
- No secrets reach browser JavaScript.
- Documentation is updated.
