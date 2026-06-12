# Codex Agent Build Instructions

Use this document to guide a Codex agent through implementation. Run one phase at
a time. Require the agent to inspect existing work before editing and to finish
each phase with tests and a browser verification.

## Global Instructions for Every Phase

Give the agent these instructions before the phase-specific request:

```text
You are building an authenticated, multi-tenant report-generation product.

Read Product App Plan/FRONTEND_PRODUCT_PLAN.md and
Product App Plan/API_CONTRACTS.md before implementation.

The complete frontend must be built using React and TypeScript. Use Next.js as the
React framework. Every screen, route, form, workflow, report template, preview,
published report viewer, and authentication interface must be implemented as React
components.

Assessments are multi-page report sets. Lysol initially has Digital Health
Assessment, Competitive Position Report, and Competitive Signal Dashboard pages,
but it can have additional pages. Never hardcode the frontend around exactly three
pages. Page navigation, generation, ordering, review, and publication must operate
on an ordered page collection.

Use shadcn/ui components as much as possible. Before creating any shared product
UI primitive, check whether shadcn/ui provides an appropriate component. Prefer
composing and styling shadcn/ui components instead of hand-building buttons,
forms, tables, tabs, dialogs, sheets, dropdowns, popovers, tooltips, accordions,
toasts, progress indicators, skeletons, sidebars, and other standard controls.
Use Lucide React icons. Do not add a competing general-purpose UI component
library. Custom React components are allowed for domain-specific report layouts,
charts, visualizations, complex data grids, and report canvases, but their
supporting controls should still use shadcn/ui when possible.

Use a frontend-first, mock-first architecture. The mock and real API clients must
implement the same interfaces. Keep authentication behind an adapter. Treat the
server as authoritative for report and job state.

Use TypeScript strict mode. Validate API responses with Zod. Use accessible,
operational UI patterns. Do not build a marketing landing page. Do not use raw
report HTML as the primary data model. Do not embed existing report HTML files,
build product screens with vanilla JavaScript, or maintain separate static HTML
implementations. Static HTML and PDF exports must be generated from the same React
report templates. Do not add unrelated dependencies or refactors.

Before editing, inspect the repository and existing conventions. After editing,
run lint, typecheck, tests, and the production build. Start the development server
and verify the affected flows in the browser at desktop and mobile widths.

Maintain a short implementation log in docs/implementation-progress.md containing
completed scope, decisions, known gaps, and the next recommended phase.
```

## Phase 0: Scaffold and Architecture

### Codex Request

```text
Create the initial frontend application using React, Next.js App Router, and
TypeScript.
Use the repository root unless an existing app structure indicates otherwise.

Implement:
- A React-only frontend architecture. All visible UI and report rendering must use
  React components.
- Initialize Tailwind CSS and shadcn/ui.
- Install and configure the initial shadcn/ui components needed for the product
  shell, forms, tables, dialogs, notifications, and loading states.
- Add a shared component policy documenting that shadcn/ui is preferred before
  creating custom product primitives.
- Strict TypeScript configuration.
- Linting, formatting, unit-test, and Playwright setup.
- Product-oriented folder structure described in the frontend plan.
- Shared design tokens and a restrained operational UI foundation.
- TypeScript domain types and Zod schemas based on API_CONTRACTS.md.
- API adapter interfaces with mock and real implementations.
- Environment-based adapter selection.
- Mock data for a Lysol multi-page assessment containing the initial three report
  pages plus an additional sample page proving the model is extensible.
- A basic implementation progress document.

Do not implement complete screens yet. Add tests proving mock payloads pass the
same schemas expected from the real API.
```

### Completion Gate

- App builds.
- Types and schemas exist.
- Mock adapter returns a Lysol workspace.
- Tests validate mock contract compatibility.

## Phase 1: Authentication and App Shell

### Codex Request

```text
Implement the authenticated application shell and auth adapter.

Implement:
- Mock authentication provider with signed-in, signed-out, expired-session, and
  unauthorized scenarios.
- Server-side protected app layout.
- Login, forgot-password, accept-invite, and unauthorized pages.
- Organization switcher, primary navigation, notification button, and user menu.
- Capability-based UI helper functions.
- Responsive desktop and mobile layouts.
- Accessible loading, error, and empty states.
- Use shadcn/ui form, sidebar, dropdown-menu, avatar, button, sheet, alert,
  skeleton, and toast components where applicable.

Do not connect a real auth vendor yet. Ensure the adapter can later support Auth0,
Clerk, Azure AD, or a custom cookie session.
```

### Completion Gate

- Protected routes redirect correctly.
- Role and capability helpers have tests.
- App shell works on desktop and mobile.

## Phase 2: Workspace and Engagement Management

### Codex Request

```text
Implement workspace and engagement management using the mock API.

Implement:
- Home dashboard.
- Workspace table with search and filters.
- Create-workspace form.
- Workspace overview.
- Engagement list and create-engagement flow.
- Recent reports and recent activity.
- Role-aware actions and clear empty states.

Use TanStack Query for server state and React Hook Form plus Zod for forms.
Use shadcn/ui tables, forms, dialogs, badges, dropdown menus, pagination, and
empty-state supporting primitives where applicable.
```

### Completion Gate

- Analyst can create and open a mock workspace.
- Workspace routes survive refresh.
- Permission restrictions are tested.

## Phase 3: New Report Run Wizard

### Codex Request

```text
Implement a resumable new-report-run wizard.

Steps:
1. Scope and report label.
2. Domains and digital properties.
3. Competitors.
4. Tool selection.
5. Data-access readiness.
6. Report templates and snapshot types.
7. Review and start.

Autosave the draft through the mock API. Validate each step. Support leaving and
resuming. Starting the run should create a mock tools-generation job and navigate
to the run command center.
```

### Completion Gate

- Draft resumes after refresh.
- Invalid inputs cannot start a run.
- Start action creates a job and navigates correctly.

## Phase 4: Run Command Center and Notifications

### Codex Request

```text
Implement the report-run command center and notification system.

Implement:
- Pipeline stage navigation.
- Current job state and progress.
- Activity feed.
- Required-action cards.
- Retry and cancel actions with confirmations.
- Global job activity indicator.
- Notification center with deep links.
- Mock event-stream adapter that can simulate success, slow progress, failure,
  retry, and waiting-for-input scenarios.
- Event reconnection and authoritative refetch behavior.

Do not invent progress percentages when a mock scenario omits them.
```

### Completion Gate

- User can leave the run page and still see global job progress.
- Completion and failure notifications deep-link correctly.
- Reconnection and duplicate-event behavior have tests.

## Phase 5: Tools and Baseline

### Codex Request

```text
Implement the Tools Report and Baseline Review stages.

Tools Report:
- Tool status table.
- Expandable summaries.
- Individual retry.
- Waive-unavailable-tool flow with reason.
- Raw evidence permission boundary.

Baseline Review:
- Coverage summary.
- Metrics table.
- Validation issue queue.
- Evidence/source drawer.
- Resolve or waive issue.
- Lock baseline confirmation.

Ensure an assessment cannot be generated until the baseline is locked.
```

### Completion Gate

- Tool failures can be retried.
- Validation issues can be resolved.
- Baseline lock is permission-controlled and irreversible in the UI.

## Phase 6: Snapshot Manager

### Codex Request

```text
Implement snapshot generation and management.

Implement:
- Health, competitive, and trend snapshot types.
- Snapshot table with source baseline, timestamp, version, and state.
- Generate and regenerate flows.
- Compare two snapshots.
- Clear explanation when trend is unavailable because history is insufficient.
```

### Completion Gate

- Snapshots can be generated from a locked baseline.
- Compare screen handles added, changed, and removed metrics.

## Phase 7: Assessment Editor and Report Templates

### Codex Request

```text
Implement the structured assessment editor and initial report template registry.

Create reusable, data-driven templates based on the existing report references in
Reports HTML:
- digital-health-assessment.v1
- competitive-position-report.v1
- competitive-signal-dashboard.v1

Implement:
- Data-driven multi-page and section navigation.
- Add, remove, duplicate, rename, and reorder page operations.
- Structured narrative fields.
- Score and status controls.
- Evidence drawer.
- Autosave.
- Version history.
- Validation warnings.
- Template registry and schema requirements.

Do not copy or embed the report HTML into components as one raw string. Rebuild
the reports as reusable React components and feed them structured mock report
data. The existing HTML files are visual references only.
```

### Completion Gate

- Lysol assessment renders its full ordered page collection from shared structured
  data.
- Adding an additional page does not require changing navigation components.
- Editing structured content updates preview data.
- Templates have focused component tests.

## Phase 8: Assessment Preview

### Codex Request

```text
Implement the assessment preview workspace.

Implement:
- Data-driven selector for every page in the related assessment.
- Page grouping and ordering.
- Desktop, tablet, and mobile preview modes.
- Full-screen preview.
- Draft/review/approved/published status.
- Validation warnings.
- Section comments.
- Previous-version comparison.
- Static HTML export interface placeholder that will export from the same React
  templates.

Verify the report pages against the existing HTML references while keeping the new
templates responsive and accessible.
```

### Completion Gate

- Every page in the assessment collection renders at desktop and mobile widths.
- No overlapping text or controls.
- Preview switching does not lose editor state.

## Phase 9: Review, Approval, Publication, and Sharing

### Codex Request

```text
Implement report review, approval, publication, and client-safe access.

Implement:
- Submit-for-review action.
- Review checklist.
- Request-changes action with required reason.
- Approve action.
- Immutable published version.
- Published report route.
- Share-link creation and expiration settings.
- Client viewer access without internal evidence, notes, or generation controls.
- Version and audit history.

Enforce role and capability boundaries in both UI behavior and mocked API
responses.
```

### Completion Gate

- Analyst cannot approve without capability.
- Reviewer can request changes or approve.
- Published report is client-safe.
- Previous published versions remain accessible to authorized internal users.

## Phase 10: Real Backend and Auth Integration

### Codex Request

```text
Replace mock adapters with real backend and authentication integrations without
changing feature components.

Implement:
- Real cookie-session auth adapter.
- Real HTTP API adapter.
- Real SSE event-stream adapter.
- Correlation ID display for support.
- Production error reporting hooks.
- Secure shared-report route.

Keep mock mode available for development and automated testing.
```

### Completion Gate

- Feature components do not directly depend on the auth vendor or transport.
- Mock and real adapters pass the same contract tests.
- Security and failure-state checks are documented.

## Final Hardening Request

```text
Perform a production-readiness review of the complete frontend.

Review and fix:
- Any frontend route, report, or interaction that is not implemented in React.
- Hand-built standard UI controls that should be replaced by shadcn/ui components.
- Authentication and authorization gaps.
- Cross-organization access risks.
- Unsanitized report content.
- Missing loading, empty, and error states.
- Long-running job resilience.
- Accessibility.
- Responsive layout.
- Performance.
- Test coverage for critical workflows.

Run lint, typecheck, unit tests, end-to-end tests, and production build. Report
remaining risks with file references.
```
