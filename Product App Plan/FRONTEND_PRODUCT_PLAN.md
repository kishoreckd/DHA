# Frontend Product Plan

## 1. Product Vision

Build an authenticated, multi-tenant report-generation workspace that guides users
from initial tool execution through baseline creation, snapshot generation,
assessment generation, preview, approval, and publication.

## Mandatory React Frontend Requirement

The complete frontend must be implemented using React and TypeScript. This is a
non-negotiable architectural requirement.

- Use Next.js as the React application framework.
- Build every product route and visible interface from React components.
- Build all report templates and report-page variants from reusable React
  components fed by structured report data.
- Build authentication, notifications, generation workflows, editors, previews,
  review screens, client-safe viewers, and administrative screens in React.
- Use shadcn/ui as the default product component system wherever an appropriate
  component exists.
- Do not create separately maintained vanilla JavaScript, jQuery, or hand-authored
  static HTML versions of product screens.
- Do not embed the existing report HTML files through iframes or raw HTML blobs.
- Static HTML or PDF reports may be exported from the React report renderers, but
  exported files are generated artifacts and not a second frontend codebase.

The product should make long-running backend work understandable and trustworthy.
Users must always know:

- What is being generated.
- Which inputs and data sources are being used.
- What stage the generation process has reached.
- Whether action is required.
- What changed between report versions.
- Which report pages are ready to preview or publish.

The frontend should initially operate against a mock backend, then connect to real
HTTP and event-stream APIs without changing its domain model.

## 2. Primary User Types

### Platform Admin

- Manages organizations, users, roles, templates, and global settings.
- Can inspect all workspaces, jobs, and audit logs.
- Can retry or cancel failed jobs.

### Organization Admin

- Manages users and settings within one organization.
- Creates client workspaces and engagements.
- Controls report access and publication.

### Analyst

- Configures tools and report inputs.
- Starts generation jobs.
- Reviews findings and resolves validation issues.
- Updates report content before approval.

### Reviewer / Approver

- Reviews assessment previews and changes.
- Adds comments and requests revisions.
- Approves reports for publication.

### Client Viewer

- Has read-only access to explicitly shared or published reports.
- Cannot access internal generation details or edit content.

## 3. Domain Hierarchy

```text
Organization
  -> Client Workspace
      -> Engagement
          -> Report Run
              -> Tool Runs
              -> Baseline
              -> Snapshots
              -> Assessment
                  -> Report Page Set
                      -> Report Page 1..N
              -> Preview / Approval
              -> Publication
```

### Example

```text
CXOntology
  -> Lysol
      -> June 2026 Digital Assessment
          -> Report Run #1
              -> Tools Report
              -> Baseline Report
              -> Competitive Snapshot
              -> Assessment Page Set
                  -> Digital Health Assessment
                  -> Competitive Position Report
                  -> Competitive Signal Dashboard
                  -> Additional Lysol pages as required
```

### Multi-Page Assessment Requirement

Lysol must be modeled as one client workspace whose assessment can contain
multiple related report pages. The current three pages are the initial example,
not a maximum or hardcoded page list.

The page set must support:

- Any number of report pages.
- Adding pages from the template registry.
- Custom page titles and slugs.
- Reordering pages.
- Grouping pages into sections or report families.
- Page-level draft, review, approval, publication, and visibility status.
- Regenerating one page without forcing regeneration of every page.
- Previewing and publishing selected pages or the complete page set.
- Shared assessment-level structured data with optional page-specific data.
- Page-level comments, validation issues, version history, and permissions.
- Future executive summary, methodology, appendix, regional, trend, and custom
  report pages.

## 4. Generation Pipeline

The frontend should represent generation as an explicit pipeline, not a collection
of unrelated buttons.

### Required Stages

1. **Configuration**
   - Select client, domains, competitors, geography, industry profile, and scope.
   - Select tools and data sources.
   - Validate required inputs.

2. **Tools Report Generation**
   - Submit tool-run request to backend.
   - Display progress for each selected tool.
   - Allow users to leave the page while work continues.
   - Notify users when complete, failed, or blocked.

3. **Baseline Report Generation**
   - Consolidate normalized tool results.
   - Show validation issues, missing fields, and conflicts.
   - Require analyst confirmation before locking the baseline.

4. **Snapshot Report Generation**
   - Generate one or more point-in-time snapshots.
   - Support internal health, competitive, and future trend snapshot types.
   - Record snapshot timestamp and source baseline.

5. **Assessment Report Generation**
   - Generate scored pillars, metrics, findings, recommendations, and narratives.
   - Generate the related multi-page report set from the selected page templates.
   - Allow individual pages to complete, fail, or regenerate independently.

6. **Assessment Preview**
   - Preview pages in desktop, tablet, and mobile frames.
   - Review page content, evidence, methodology, and unresolved warnings.
   - Compare against a previous report version.

7. **Approval and Publication**
   - Submit for review.
   - Approve or request changes.
   - Publish a version and create a client access link.
   - Keep immutable published versions.

## 5. Job State Machine

All long-running generation tasks should use the same state model.

```text
draft
queued
running
waiting_for_input
validating
completed
failed
cancelled
superseded
```

### UX Requirements by State

| State | UI Behavior |
|---|---|
| draft | Editable configuration and clear start action |
| queued | Queue position when available; cancellation allowed |
| running | Stage progress, elapsed time, activity log, leave-page reassurance |
| waiting_for_input | Prominent task card describing required user action |
| validating | Validation progress and emerging warnings |
| completed | Completion notification and next-stage action |
| failed | Human-readable error, retry action, diagnostic reference |
| cancelled | Cancellation reason and restart action |
| superseded | Link to the newer run that replaced this run |

The frontend must never invent progress percentages when the backend does not
provide them. Use stage-based progress and indeterminate indicators instead.

## 6. Frontend Information Architecture

### Public Routes

```text
/login
/forgot-password
/reset-password
/accept-invite
/shared/reports/:shareToken
```

### Authenticated Routes

```text
/app
/app/workspaces
/app/workspaces/new
/app/workspaces/:workspaceId
/app/workspaces/:workspaceId/settings
/app/workspaces/:workspaceId/engagements/:engagementId
/app/runs/:runId
/app/runs/:runId/tools
/app/runs/:runId/baseline
/app/runs/:runId/snapshots
/app/runs/:runId/assessment
/app/runs/:runId/preview
/app/runs/:runId/review
/app/reports/:reportId
/app/reports/:reportId/versions
/app/jobs
/app/notifications
/app/settings/profile
/app/settings/team
/app/settings/integrations
/app/admin
```

## 7. Main Screens

### 7.1 Sign In and Account Access

- Email/password sign-in.
- SSO-ready provider button area.
- Password recovery.
- Invitation acceptance.
- Session-expired state with return URL.
- Clear errors without revealing whether an account exists.

### 7.2 Application Shell

- Organization switcher.
- Workspace switcher.
- Primary navigation.
- Global job activity indicator.
- Notification center.
- User menu and role-aware settings.
- Responsive mobile navigation.

### 7.3 Home Dashboard

- Active report runs.
- Jobs requiring attention.
- Recently completed reports.
- Drafts awaiting review.
- Failed jobs with retry permissions.
- Recent workspace activity.

### 7.4 Workspace List

- Search and filter by client, industry, status, owner, and updated date.
- Table-first operational layout.
- Create workspace action.
- Clear empty and loading states.

### 7.5 Workspace Overview

- Client identity and domains.
- Current engagement status.
- Latest published report set.
- Previous assessments and trend history.
- Team members and access.
- Start new report run action.

### 7.6 New Report Run Wizard

Use a resumable multi-step wizard:

1. Scope
2. Domains and properties
3. Competitors
4. Tool selection
5. Data access and credentials status
6. Report templates
7. Review and start

The wizard must autosave drafts and allow returning later.

### 7.7 Run Command Center

This is the primary operational screen.

- Horizontal pipeline showing all generation stages.
- Current stage summary.
- Generation activity feed.
- Required-action cards.
- Job logs written for business users, with technical diagnostics available on
  demand.
- Input configuration summary.
- Cancel, retry, regenerate, and continue actions based on permissions and state.

### 7.8 Tools Report

- One row per tool.
- Tool state, last event, duration, and collected artifact count.
- Expandable result summary.
- Retry individual failed tools.
- Mark unavailable tools as waived with reason.
- View raw evidence only for permitted roles.

### 7.9 Baseline Review

- Coverage summary.
- Missing and conflicting data.
- Normalized metric table.
- Evidence/source drawer.
- Validation issue queue.
- Analyst notes.
- Lock baseline action with confirmation.

### 7.10 Snapshot Manager

- Snapshot cards or table grouped by type.
- Internal health snapshot.
- Competitive snapshot.
- Trend snapshot when enough history exists.
- Generate, regenerate, archive, and compare actions.
- Source baseline and generation timestamp.

### 7.11 Assessment Editor

- Structured editor, not raw HTML.
- Left navigation for a configurable multi-page report set and page sections.
- Add, remove, duplicate, rename, and reorder pages when permitted.
- Main editing surface.
- Evidence and assistant panel.
- Score and status controls constrained by permissions.
- Narrative fields with autosave and version history.
- Validation warnings for missing evidence or inconsistent scores.

### 7.12 Assessment Preview

- Report selector for every page in the related multi-page assessment set.
- Page ordering and page-group navigation.
- Desktop, tablet, and mobile viewport controls.
- Preview generated from structured report data.
- Full-screen preview.
- Page status: draft, needs review, approved, published.
- Comment pins or section comments.
- Previous-version comparison.

For the initial Lysol example, the selector should contain:

- Digital Health Assessment
- Competitive Position Report
- Competitive Signal Dashboard

The selector must be data-driven and automatically support additional Lysol pages.
No component may assume that exactly three pages exist.

### 7.13 Review and Approval

- Review checklist.
- Open comments and unresolved issues.
- Changed sections since last approval.
- Request changes action with required reason.
- Approve action with confirmation.
- Audit trail.

### 7.14 Published Report Access

- Client-safe report viewer.
- No internal notes or generation controls.
- Access policy and expiration.
- Optional viewer identity gate.
- Download/export actions when enabled.

### 7.15 Jobs and Notification Center

- Unified list of generation jobs.
- Filters by state, type, workspace, owner, and date.
- Notification preferences.
- Mark read/unread.
- Deep links to the relevant run stage.

## 8. Report Compatibility Strategy

Do not store report content as one large HTML string as the primary source of
truth. Store structured report data and render it through versioned templates.

### Recommended Layers

```text
Report data model
  -> Versioned React report template
      -> Interactive authenticated React preview
      -> Published React web report
      -> Generated static HTML export
      -> Generated PDF export
```

### Page Template Registry

Each report page type should register:

- Template ID and version.
- Supported report family.
- Required data schema.
- Render component.
- Static export renderer.
- Validation rules.
- Supported preview sizes.

Example IDs:

```text
digital-health-assessment.v1
competitive-position-report.v1
competitive-signal-dashboard.v1
executive-summary.v1
methodology.v1
appendix.v1
```

The existing HTML files should be treated as visual and content references while
the reusable React components are rebuilt from structured data. They must never be
embedded into the application as production report pages.

## 9. Recommended Technical Architecture

### Frontend Stack

- Next.js with App Router as the React framework.
- TypeScript with strict mode.
- React for every frontend screen and report renderer.
- Tailwind CSS.
- shadcn/ui as the default component system.
- Radix UI primitives through shadcn/ui when applicable.
- Lucide React icons.
- TanStack Query for server state.
- Zod for runtime validation.
- React Hook Form for forms.
- Zustand only for small cross-page UI state if needed.
- Storybook for reusable report and product components.
- Vitest and React Testing Library.
- Playwright for end-to-end tests.

### shadcn/ui Component Policy

Use shadcn/ui components as much as possible across the authenticated product,
assessment editor, preview workspace, administration screens, and client-safe
report viewer.

Prefer shadcn/ui for:

- Buttons, icon buttons, badges, alerts, avatars, breadcrumbs, and separators.
- Inputs, textareas, selects, comboboxes, checkboxes, radio groups, switches,
  sliders, calendars, date pickers, and form validation presentation.
- Tables, pagination, tabs, accordions, collapsibles, tooltips, hover cards, and
  command palettes.
- Dialogs, alert dialogs, drawers, sheets, dropdown menus, context menus,
  navigation menus, and popovers.
- Toasts, progress indicators, skeletons, scroll areas, resizable panels, and
  sidebars.
- Cards only where a genuinely framed or repeated item is appropriate.

Implementation rules:

- Search the installed shadcn/ui components before creating a new shared UI
  primitive.
- Compose and style shadcn/ui components to match the product design rather than
  replacing them with hand-built equivalents.
- Keep shadcn/ui component source in the standard shared component location.
- Preserve accessibility behavior supplied by shadcn/ui and Radix primitives.
- Use React Hook Form, Zod, and shadcn/ui form components together.
- Use Lucide icons inside buttons and controls whenever an appropriate icon exists.
- Do not add another competing general-purpose component library.
- Custom React components are appropriate for report-specific visualizations,
  score rings, evidence views, complex data grids, page canvases, charts, and
  domain-specific report layouts that shadcn/ui does not provide.
- Custom components should still reuse shadcn/ui primitives for their controls,
  menus, dialogs, tooltips, and supporting interface elements.

### Why Next.js

- It is a React framework and keeps the complete frontend in React.
- Supports authenticated product routes and public report routes.
- Supports server-side auth/session checks.
- Supports report preview and public rendering.
- Provides a path to generating static HTML exports from the same React report
  components.

### Frontend Layers

```text
app/                 Route composition and layouts
features/            Domain-focused product features
components/          Shared UI components
report-templates/    Versioned report-page renderers
lib/api/             API client and contract validation
lib/auth/            Auth-provider adapter
lib/events/          Job event-stream adapter
lib/permissions/     RBAC and capability checks
lib/mocks/           Mock API and event scenarios
types/               Shared TypeScript domain types
```

## 10. Authentication and Authorization

### Auth Requirements

- Secure session cookies rather than tokens in local storage.
- Support email/password first.
- Keep an adapter for Auth0, Clerk, Azure AD, or another provider.
- Route protection at the server/layout boundary.
- Session refresh and expiry handling.
- Invitation flow.
- Organization membership.
- Optional MFA and SSO later.

### Authorization Model

Use roles for broad access and capabilities for precise UI decisions.

Example capabilities:

```text
workspace.create
workspace.manage
run.create
run.cancel
run.retry
baseline.edit
baseline.lock
assessment.edit
assessment.review
assessment.approve
report.publish
report.share
evidence.view_raw
team.manage
admin.access
```

The backend must enforce all permissions. Frontend capability checks only control
presentation and improve usability.

## 11. Backend Integration Model

### HTTP

Use HTTP for:

- Creating and updating resources.
- Starting or cancelling generation jobs.
- Loading workspaces, runs, reports, and versions.
- Resolving validation issues.

### Server-Sent Events or WebSocket

Use an event stream for:

- Job state changes.
- Stage progress.
- Tool completion.
- Required-action events.
- Report generation completion.
- Notification delivery.

SSE is recommended first because the frontend primarily receives updates.

### Resilience

- Reconnect event streams automatically.
- Refetch authoritative job state after reconnection.
- Poll at a low frequency when streaming is unavailable.
- Deduplicate events using event IDs.
- Never assume a notification means the related resource is already loaded.

## 12. Notification Design

### In-App Notifications

- Generation started.
- Tool failed.
- User input required.
- Baseline ready for review.
- Assessment ready for preview.
- Changes requested.
- Report approved.
- Report published.

### External Notifications

The backend may later send email, Slack, or Teams notifications. The frontend
should expose preferences but should not send these directly.

### Notification Payload Rules

Every notification should include:

- Type.
- Human-readable title and message.
- Created timestamp.
- Severity.
- Workspace/run/report identifiers.
- Deep-link URL.
- Read state.

## 13. Frontend Data and State Rules

- Treat the server as authoritative for business state.
- Use optimistic updates only for low-risk UI actions such as marking a
  notification read.
- Do not optimistically mark jobs complete, approve reports, or publish versions.
- Persist wizard drafts through the API.
- Display stale-data and reconnection states.
- Validate every API response at the boundary.
- Use stable IDs, not display names, as relationships.

## 14. Mock-First Development

Create a mock API implementation with scenario controls:

- Successful full generation.
- Slow tool generation.
- One tool failure followed by retry.
- Waiting for user input.
- Baseline validation issues.
- Assessment generation failure.
- Review changes requested.
- Successful publication.

Mocks should use the same TypeScript interfaces and Zod schemas as the real API.
The UI should switch between mock and real adapters using environment
configuration.

## 15. Design Principles

- Operational and work-focused rather than marketing-oriented.
- Use shadcn/ui components as the default building blocks for consistent,
  accessible product interactions.
- Dense but readable tables for jobs, metrics, and issues.
- Clear hierarchy between client, engagement, run, and report.
- Use cards only for repeated items or true framed tools.
- Keep generation state visible across routes.
- Avoid ambiguous status colors; always pair color with text.
- Make destructive and irreversible actions explicit.
- Show timestamps and version identifiers throughout.
- Support keyboard navigation and accessible status announcements.

## 16. Error and Empty States

Design these states intentionally:

- No workspaces yet.
- Workspace without an engagement.
- Draft run not started.
- Run queued for a long time.
- Event stream disconnected.
- Tool partially completed.
- Missing required access.
- Baseline conflicts.
- Assessment not generated.
- Preview unavailable.
- No permission to perform an action.
- Published report link expired.

## 17. Security Requirements

- Never expose backend credentials or integration secrets to the browser.
- Sanitize any rich report content.
- Use a strict Content Security Policy.
- Validate shared-report tokens on the server.
- Record audit events for generation, edits, approvals, sharing, and publishing.
- Prevent cross-organization resource access.
- Do not display raw evidence to client viewers.
- Avoid sensitive data in browser logs and analytics.

## 18. Analytics and Observability

Track product events such as:

- Workspace created.
- Report run started.
- Stage completed or failed.
- Required action resolved.
- Preview opened.
- Review submitted.
- Report approved and published.

Do not track sensitive report content. Include correlation IDs for support and
debugging.

## 19. Delivery Phases

### Phase 0: Product Foundation

- Confirm terminology and domain entities.
- Create schemas and mock scenarios.
- Establish design tokens and product shell.
- Implement auth adapter and mocked session.
- Establish the rule that all frontend and report rendering uses React components.

### Phase 1: Authenticated Workspace MVP

- Sign-in flow.
- App shell.
- Workspace list and overview.
- Create workspace.
- Team and role placeholders.

### Phase 2: Report Run Workflow

- New run wizard.
- Run command center.
- Tools stage.
- Job status and event notifications.
- Retry/cancel behavior.

### Phase 3: Baseline and Snapshot Workflow

- Baseline validation screen.
- Baseline lock.
- Snapshot manager.
- Snapshot comparison.

### Phase 4: Assessment and Preview

- Structured assessment editor.
- Initial three report templates and extensible multi-page page-set management.
- Responsive preview.
- Validation and comments.

### Phase 5: Review, Approval, and Publication

- Review checklist.
- Approval state machine.
- Published report route.
- Shared access controls.
- Version history.

### Phase 6: Production Integration

- Connect real auth provider.
- Connect backend HTTP API.
- Connect event stream.
- Security review.
- Performance and accessibility review.
- Production monitoring.

## 20. MVP Boundaries

### Include

- Authenticated organization and workspace navigation.
- One report run per engagement at a time.
- Mocked tools, baseline, snapshot, and assessment jobs.
- Initial three Lysol-compatible report page templates.
- Extensible multi-page assessments supporting additional Lysol pages.
- Preview, review, approval, and publication states.
- In-app notifications.
- Role-aware UI.
- React-based templates for every report page type.

### Defer

- Billing and subscriptions.
- Full template builder.
- Real-time multi-user co-editing.
- Custom client branding editor.
- Slack and Teams integrations.
- Advanced trend analytics.
- Automated PDF production beyond a basic export path.

## 21. Definition of Done for Frontend MVP

- A signed-in analyst can create a workspace and start a report run.
- The run progresses through mocked long-running generation stages.
- The analyst receives an in-app completion or failure notification.
- The analyst can review and lock the baseline.
- The analyst can generate snapshots and an assessment.
- The initial Lysol assessment produces at least three linked report pages and can
  support additional pages without architectural changes.
- A reviewer can request changes or approve.
- An authorized user can publish a version.
- A client viewer can access the published report without seeing internal data.
- Every frontend route and report page is rendered from React components.
- Refreshing or leaving the page does not lose authoritative job state.
- Role restrictions are reflected in the UI and covered by tests.
