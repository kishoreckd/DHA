# Master "Give Me" Codex Prompt

Paste this instruction into Codex when you are ready to begin building the
frontend:

```text
Give me a complete authenticated frontend for a multi-tenant report-generation
product using React, Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.

Before implementation, read:
- Product App Plan/FRONTEND_PRODUCT_PLAN.md
- Product App Plan/API_CONTRACTS.md
- Product App Plan/CODEX_AGENT_BUILD_INSTRUCTIONS.md

Build everything in React. Every product screen, workflow, form, table, dialog,
report template, report preview, published report viewer, authentication screen,
and administration screen must be implemented as React components.

Use shadcn/ui components as much as possible. Before creating any shared UI
primitive, check whether shadcn/ui already provides an appropriate component.
Prefer composing and styling shadcn/ui instead of hand-building standard controls.
Use Lucide React icons. Do not add another general-purpose UI component library.
Custom React components are acceptable for report-specific layouts, charts,
visualizations, complex data grids, score displays, and report canvases, but use
shadcn/ui for their supporting controls wherever possible.

Use a frontend-first, mock-first architecture. Build mock and real API adapters
against the same TypeScript interfaces and Zod schemas. Keep authentication behind
an adapter. Treat backend state as authoritative.

The product workflow is:
1. Tools report generation.
2. Baseline report generation and validation.
3. Snapshot report generation.
4. Assessment generation.
5. Multi-page assessment editing and preview.
6. Review, approval, publication, and client-safe sharing.

Assessments are multi-page report sets. Lysol initially contains:
- Digital Health Assessment
- Competitive Position Report
- Competitive Signal Dashboard

Lysol can have additional pages. Never hardcode exactly three pages. Users with
permission must be able to add, remove, duplicate, rename, reorder, regenerate,
review, approve, and publish pages independently or as a complete assessment.

The existing files in Reports HTML are visual and content references only. Do not
embed them, iframe them, or use them as raw HTML production pages. Rebuild reports
as reusable, data-driven React templates. Static HTML and PDF reports should later
be generated from the same React templates.

Support authentication, organizations, roles, capabilities, protected routes,
long-running backend jobs, event-stream updates, notifications, retry and cancel
flows, required-user-action states, structured report editing, responsive preview,
version history, and client-safe published reports.

Follow the phased implementation plan in
Product App Plan/CODEX_AGENT_BUILD_INSTRUCTIONS.md. Begin with Phase 0 only. Finish
the phase completely before stopping.

Before editing, inspect the repository. After implementation, run lint, typecheck,
tests, and production build. Start the development server and verify the frontend
at desktop and mobile widths. Update docs/implementation-progress.md with completed
work, decisions, known gaps, and the recommended next phase.
```

