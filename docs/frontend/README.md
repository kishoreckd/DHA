# DHA Frontend Delivery Plan

This folder defines the frontend plan for building the DHA Digital Assessment Platform as a React TypeScript application.

The plan is based on:

- The current assessment workflow you described.
- The 40-section baseline workbook.
- The 68-metric snapshot and scoring workbook.
- The target stack: React, TypeScript, Python backend, and MongoDB.
- The required workflow from URL intake through evidence collection, baseline creation, snapshot scoring, review, and publication.

## Planning documents

- [Phased roadmap](./phased-roadmap.md) - phase index, dependencies, acceptance gates, and release grouping.
- [Implementation blueprint](./implementation-blueprint.md) - React TypeScript architecture, folder structure, routes, API patterns, types, permissions, testing, and first implementation sprint.

## Separate phase documents

Each phase has its own implementation-focused document:

- [Phase 00 - Foundation](./phases/phase-00-foundation.md)
- [Phase 01 - Workspaces and shell](./phases/phase-01-workspaces-shell.md)
- [Phase 02 - Discovery](./phases/phase-02-discovery.md)
- [Phase 03 - Tool jobs](./phases/phase-03-tool-jobs.md)
- [Phase 04 - Methodology admin](./phases/phase-04-methodology-admin.md)
- [Phase 05 - Evidence review](./phases/phase-05-evidence-review.md)
- [Phase 06 - Baseline](./phases/phase-06-baseline.md)
- [Phase 07 - Scoring and snapshot](./phases/phase-07-scoring-snapshot.md)
- [Phase 08 - Review and approval](./phases/phase-08-review-approval.md)
- [Phase 09 - Reports and publication](./phases/phase-09-reports-publication.md)
- [Phase 10 - Permissions](./phases/phase-10-permissions.md)
- [Phase 11 - Hardening](./phases/phase-11-hardening.md)

## Product objective

The frontend must support this full operational journey:

```text
Workspace and website setup
  -> page and competitor discovery
  -> discovery approval
  -> tool synchronization
  -> evidence validation
  -> baseline authoring
  -> metric scoring
  -> snapshot generation
  -> review and approval
  -> HTML/PDF publication
  -> historical comparison
```

The frontend is not responsible for calculating authoritative scores, running long-lived jobs, enforcing security, or storing secret credentials. Those responsibilities belong to the backend.

The frontend is responsible for:

- Clean workflows.
- Typed API integration.
- Good validation.
- Clear state handling.
- Permission-aware navigation.
- Evidence and provenance visibility.
- Analyst/reviewer/publisher user experience.

## Guiding frontend principles

1. Build this as a React TypeScript SPA, not as a Next.js app.
2. Keep pages inside `src/pages`.
3. Keep product modules inside `src/features`.
4. Keep shared reusable UI inside `src/shared/components`.
5. Keep backend types inside `src/types`.
6. Use TanStack Query for server-state.
7. Use React Hook Form and Zod for forms.
8. Treat every long-running action as a backend job.
9. Keep evidence, scores, reports, and publications visibly distinct.
10. Never overwrite approved or published versions in-place.
11. Show loading, empty, error, partial, stale, and denied states on every major page.
12. Make provenance visible from finding to page, tool run, and artifact.

## Recommended first release boundary

The first production workflow should support:

- One organization with multiple client workspaces.
- One primary website per assessment.
- Up to three competitors.
- Homepage, PDP, PLP, and manually selected additional pages.
- Existing tool integrations through persistent backend jobs.
- Persistent run history, retry, and stale-state handling.
- Versioned methodology and metric definitions.
- Baseline draft generation and analyst editing.
- Snapshot score generation and competitor comparison.
- Review, approval, and versioned HTML publication.

