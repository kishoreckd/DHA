# Report Generation Product App

This folder defines the frontend-first product plan for turning the existing report
artifacts into a multi-tenant report-generation application.

## Mandatory Frontend Technology

The complete frontend must be built with React and TypeScript.

- Every screen, workflow, form, table, modal, report template, report preview,
  published report viewer, and authentication interface must be a React component.
- Next.js is the selected React framework for routing, layouts, authenticated
  product pages, public report pages, and rendering.
- Use shadcn/ui components as much as possible for standard product UI. Prefer
  composing and extending shadcn/ui components over creating replacement UI
  primitives.
- The existing files in `Reports HTML` are visual and content references only.
  They must not be embedded as production pages or used as the application's
  primary report implementation.
- Static HTML and PDF files may be generated as exports from React report
  templates. They are outputs, not separately maintained frontend implementations.

## Documents

- `FRONTEND_PRODUCT_PLAN.md`: Product scope, architecture, screens, workflows,
  permissions, state management, delivery phases, and acceptance criteria.
- `API_CONTRACTS.md`: Proposed backend contracts, domain entities, job states,
  events, and example payloads.
- `CODEX_AGENT_BUILD_INSTRUCTIONS.md`: Phased instructions and prompts for a Codex
  agent to build the application safely and incrementally.

## Core Product Model

One organization can contain multiple client workspaces. A client workspace, such
as Lysol, can contain multiple engagements and report runs. Each assessment is a
multi-page report set and can contain any number of related pages.

The initial Lysol example includes:

1. Digital Health Assessment
2. Competitive Position Report
3. Competitive Signal Dashboard

These three pages are examples, not a fixed limit. Lysol may also have executive
summary, methodology, appendix, regional, trend, custom analysis, or future report
pages. The product must support adding, ordering, generating, reviewing, approving,
previewing, publishing, and regenerating pages without coupling the application to
Lysol-specific content.

## Recommended Starting Point

Build the frontend using mocked API contracts first. Keep authentication, report
rendering, and notification delivery behind adapters so they can be connected to
the real backend later without rewriting the React UI.
